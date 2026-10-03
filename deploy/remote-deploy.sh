#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

app_dir="${KVN_APP_DIR:-/var/www/kvn-footwear}"
env_file="${KVN_ENV_FILE:-${app_dir}/.env.production}"
release_env_file="${KVN_RELEASE_ENV_FILE:-${app_dir}/.release.env}"
compose_file="${KVN_COMPOSE_FILE:-${app_dir}/docker-compose.deploy.yml}"
backup_script="${app_dir}/deploy/backup-db.sh"
image_ref="${1:-}"

fail() {
  echo "Erreur: $*" >&2
  exit 1
}

(( EUID == 0 )) || fail "Ce script doit etre lance avec root ou sudo."
[[ "$image_ref" =~ ^ghcr\.io/exodiaaaa/jersey-store:[0-9a-f]{40}$ ]] || fail "Reference d'image invalide: $image_ref"
[[ -r "$env_file" ]] || fail "Fichier d'environnement introuvable: $env_file"
[[ -r "$compose_file" ]] || fail "Fichier Compose introuvable: $compose_file"
[[ -r "$backup_script" ]] || fail "Script de sauvegarde introuvable: $backup_script"
[[ -s "${app_dir}/secrets/admin_jwt_secret" ]] || fail "Secret JWT admin introuvable."
command -v docker >/dev/null 2>&1 || fail "Docker est introuvable."
command -v curl >/dev/null 2>&1 || fail "curl est introuvable."

cd "$app_dir"

previous_release_file="$(mktemp)"
had_previous_release=false
deployment_started=false

if [[ -r "$release_env_file" ]]; then
  cp -- "$release_env_file" "$previous_release_file"
  had_previous_release=true
fi

cleanup() {
  rm -f -- "$previous_release_file"
}

compose() {
  docker compose \
    -f "$compose_file" \
    --env-file "$env_file" \
    --env-file "$release_env_file" \
    "$@"
}

wait_for_app() {
  for _attempt in {1..45}; do
    if curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3000; then
      return 0
    fi
    sleep 2
  done
  return 1
}

on_error() {
  local exit_code=$?

  echo "Le deploiement de $image_ref a echoue." >&2
  compose logs --tail=120 app >&2 || true

  if [[ "$deployment_started" == true && "$had_previous_release" == true ]]; then
    echo "Retour automatique a la version precedente." >&2
    cp -- "$previous_release_file" "$release_env_file"
    compose up -d --no-deps app || true
    wait_for_app || true
  elif [[ "$had_previous_release" == true ]]; then
    cp -- "$previous_release_file" "$release_env_file"
  fi

  cleanup
  exit "$exit_code"
}
trap on_error ERR
trap cleanup EXIT

temporary_release_file="${release_env_file}.tmp"
printf 'APP_IMAGE=%s\n' "$image_ref" > "$temporary_release_file"
mv -- "$temporary_release_file" "$release_env_file"

compose config --quiet
docker pull "$image_ref"

compose up -d mysql
for _attempt in {1..30}; do
  if compose exec -T mysql sh -ceu '
    MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin \
      --host=127.0.0.1 \
      --user="$MYSQL_USER" \
      ping --silent
  '; then
    break
  fi
  sleep 2
done

compose exec -T mysql sh -ceu '
  MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin \
    --host=127.0.0.1 \
    --user="$MYSQL_USER" \
    ping --silent
'

KVN_APP_DIR="$app_dir" \
KVN_ENV_FILE="$env_file" \
KVN_RELEASE_ENV_FILE="$release_env_file" \
KVN_COMPOSE_FILE="$compose_file" \
bash "$backup_script"

deployment_started=true
compose up -d --no-deps app
wait_for_app
deployment_started=false

chmod 0750 "${app_dir}/deploy/install-backup-timer.sh"
"${app_dir}/deploy/install-backup-timer.sh"

trap - ERR
cleanup
trap - EXIT

echo "Deploiement reussi: $image_ref"
compose ps

