#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

app_dir="${KVN_APP_DIR:-/var/www/kvn-footwear}"
env_file="${KVN_ENV_FILE:-${app_dir}/.env.production}"
compose_file="${KVN_COMPOSE_FILE:-${app_dir}/docker-compose.prod.yml}"
backup_dir="${KVN_BACKUP_DIR:-/var/backups/kvn-footwear}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"

if [[ ! -r "$env_file" ]]; then
  echo "Fichier d'environnement introuvable: $env_file" >&2
  exit 1
fi

if [[ ! -r "$compose_file" ]]; then
  echo "Fichier Docker Compose introuvable: $compose_file" >&2
  exit 1
fi

if [[ ! "$retention_days" =~ ^[0-9]+$ ]] || (( retention_days < 1 )); then
  echo "BACKUP_RETENTION_DAYS doit etre un entier superieur ou egal a 1." >&2
  exit 1
fi

if [[ "$backup_dir" == "/" || "$backup_dir" == "/var" || "$backup_dir" == "/var/backups" ]]; then
  echo "Dossier de sauvegarde trop large: $backup_dir" >&2
  exit 1
fi

mkdir -p -- "$backup_dir"

timestamp="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
backup_file="${backup_dir}/kvn_footwear_${timestamp}.sql.gz"
temporary_file="${backup_file}.tmp"

cleanup() {
  rm -f -- "$temporary_file"
}
trap cleanup EXIT

cd "$app_dir"
docker compose -f "$compose_file" --env-file "$env_file" exec -T mysql sh -ceu '
  MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump \
    --host=127.0.0.1 \
    --user="$MYSQL_USER" \
    --single-transaction \
    --quick \
    --skip-lock-tables \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --routines \
    --triggers \
    --events \
    "$MYSQL_DATABASE"
' | gzip -9 > "$temporary_file"

if [[ ! -s "$temporary_file" ]]; then
  echo "La sauvegarde generee est vide." >&2
  exit 1
fi

gzip -t "$temporary_file"
mv -- "$temporary_file" "$backup_file"
trap - EXIT

find "$backup_dir" -maxdepth 1 -type f -name 'kvn_footwear_*.sql.gz' -mtime "+${retention_days}" -delete

echo "Sauvegarde creee et verifiee: $backup_file"
