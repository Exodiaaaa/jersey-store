#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

app_dir="${KVN_APP_DIR:-/var/www/kvn-footwear}"
env_file="${KVN_ENV_FILE:-${app_dir}/.env.production}"
compose_file="${KVN_COMPOSE_FILE:-${app_dir}/docker-compose.prod.yml}"
backup_script="${app_dir}/deploy/backup-db.sh"
expected_confirmation="RESET-KVN-FOOTWEAR"

admin_email=""
confirmation=""
dry_run=false
reset_started=false

usage() {
  cat <<'EOF'
Utilisation :
  ./deploy/reset-db.sh \
    --admin-email admin@kvnfootwear.ma \
    --confirm RESET-KVN-FOOTWEAR

Options :
  --admin-email EMAIL   Compte administrateur a recreer apres le reset.
  --confirm TEXTE       Doit etre exactement RESET-KVN-FOOTWEAR.
  --dry-run             Affiche les etapes sans modifier la base.
  --help                Affiche cette aide.

Le script cree obligatoirement une sauvegarde verifiee avant toute suppression.
Le mot de passe admin est demande dans le terminal sans etre affiche.
EOF
}

fail() {
  echo "Erreur: $*" >&2
  exit 1
}

while (( $# > 0 )); do
  case "$1" in
    --admin-email)
      (( $# >= 2 )) || fail "Valeur manquante pour --admin-email."
      admin_email="$2"
      shift 2
      ;;
    --confirm)
      (( $# >= 2 )) || fail "Valeur manquante pour --confirm."
      confirmation="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "Option inconnue: $1"
      ;;
  esac
done

[[ "$confirmation" == "$expected_confirmation" ]] || fail "Confirmation incorrecte. Consultez --help."
[[ "$admin_email" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || fail "Adresse admin invalide."
[[ -d "$app_dir" ]] || fail "Dossier du projet introuvable: $app_dir"

cd "$app_dir"
app_dir="$(pwd -P)"

case "$app_dir" in
  /|/var|/var/www)
    fail "Dossier du projet trop large: $app_dir"
    ;;
esac

[[ -r "$env_file" ]] || fail "Fichier d'environnement introuvable: $env_file"
[[ -r "$compose_file" ]] || fail "Fichier Docker Compose introuvable: $compose_file"
[[ -r "$backup_script" ]] || fail "Script de sauvegarde introuvable: $backup_script"
command -v docker >/dev/null 2>&1 || fail "Docker est introuvable."

compose() {
  docker compose -f "$compose_file" --env-file "$env_file" "$@"
}

on_error() {
  local exit_code=$?

  echo "La reinitialisation a echoue." >&2
  if [[ "$reset_started" == true ]]; then
    echo "L'application reste arretee pour eviter de servir une base incomplete." >&2
    echo "Consultez la derniere sauvegarde dans /var/backups/kvn-footwear avant de continuer." >&2
  fi

  exit "$exit_code"
}
trap on_error ERR

if [[ "$dry_run" == true ]]; then
  cat <<EOF
DRY RUN - aucune modification ne sera effectuee.
1. Verifier Docker Compose et demarrer MySQL.
2. Creer et verifier une sauvegarde avec deploy/backup-db.sh.
3. Arreter le service app.
4. Supprimer et recreer uniquement la base MYSQL_DATABASE.
5. Appliquer toutes les migrations Prisma.
6. Executer le seed.
7. Recreer l'administrateur: ${admin_email}
8. Relancer l'application et verifier http://127.0.0.1:3000.
EOF
  exit 0
fi

echo "ATTENTION: toutes les donnees de la base KVN Footwear vont etre supprimees."
echo "Une sauvegarde verifiee sera creee avant le reset."

compose config --quiet
compose up -d mysql

KVN_APP_DIR="$app_dir" \
KVN_ENV_FILE="$env_file" \
KVN_COMPOSE_FILE="$compose_file" \
bash "$backup_script"

compose stop app
reset_started=true

compose exec -T mysql sh -ceu '
  case "$MYSQL_DATABASE" in
    ""|*[!A-Za-z0-9_]*)
      echo "Nom de base MYSQL_DATABASE invalide." >&2
      exit 1
      ;;
  esac

  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql \
    --host=127.0.0.1 \
    --user=root \
    --execute="DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
'

compose run --rm --no-deps app npx prisma migrate deploy
compose run --rm --no-deps app npm run db:seed
compose run --rm --no-deps app npm run admin:create -- --email "$admin_email"
compose up -d app

for attempt in {1..30}; do
  if curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3000; then
    reset_started=false
    trap - ERR
    echo "Base reinitialisee, seed applique et compte admin recree."
    echo "Application disponible sur http://127.0.0.1:3000."
    exit 0
  fi

  sleep 2
done

echo "L'application n'a pas repondu apres 60 secondes." >&2
false
