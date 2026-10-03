#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

app_dir="/var/www/kvn-footwear"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
bundle_dir="$(dirname -- "$script_dir")"

fail() {
  echo "Erreur: $*" >&2
  exit 1
}

(( EUID == 0 )) || fail "Ce script doit etre lance avec root ou sudo."
[[ -r "${bundle_dir}/docker-compose.deploy.yml" ]] || fail "docker-compose.deploy.yml est absent du paquet bootstrap."
[[ -r "${script_dir}/nginx-kvn-footwear.conf" ]] || fail "La configuration Nginx est absente du paquet bootstrap."

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx docker.io openssl ufw

if ! apt-get install -y docker-compose-v2; then
  apt-get install -y docker-compose-plugin
fi

systemctl enable --now docker
systemctl enable --now nginx

install -d -m 755 "$app_dir" "${app_dir}/deploy"
install -d -m 700 "${app_dir}/secrets" /var/backups/kvn-footwear

install -m 644 "${bundle_dir}/docker-compose.deploy.yml" "${app_dir}/docker-compose.deploy.yml"
install -m 750 "${script_dir}/backup-db.sh" "${app_dir}/deploy/backup-db.sh"
install -m 750 "${script_dir}/install-backup-timer.sh" "${app_dir}/deploy/install-backup-timer.sh"
install -m 750 "${script_dir}/remote-deploy.sh" "${app_dir}/deploy/remote-deploy.sh"
install -m 644 "${script_dir}/kvn-footwear-backup.service" "${app_dir}/deploy/kvn-footwear-backup.service"
install -m 644 "${script_dir}/kvn-footwear-backup.timer" "${app_dir}/deploy/kvn-footwear-backup.timer"

if [[ ! -e "${app_dir}/.env.production" ]]; then
  mysql_password="$(openssl rand -hex 32)"
  mysql_root_password="$(openssl rand -hex 32)"

  cat > "${app_dir}/.env.production" <<EOF
MYSQL_DATABASE=kvn_footwear
MYSQL_USER=kvn_user
MYSQL_PASSWORD=${mysql_password}
MYSQL_ROOT_PASSWORD=${mysql_root_password}
BACKUP_RETENTION_DAYS=14
EOF
  chmod 600 "${app_dir}/.env.production"
fi

if [[ ! -s "${app_dir}/secrets/admin_jwt_secret" ]]; then
  openssl rand -hex 32 > "${app_dir}/secrets/admin_jwt_secret"
  chmod 600 "${app_dir}/secrets/admin_jwt_secret"
fi

if [[ ! -e /etc/nginx/sites-available/kvn-footwear ]]; then
  install -m 644 "${script_dir}/nginx-kvn-footwear.conf" /etc/nginx/sites-available/kvn-footwear
fi

ln -sfn /etc/nginx/sites-available/kvn-footwear /etc/nginx/sites-enabled/kvn-footwear
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "Bootstrap termine."
echo "Dossier d'exploitation: $app_dir"
echo "Les secrets ont ete generes localement sur le VPS."
echo "Configurez maintenant la cle SSH GitHub Actions et les variables de l'environnement production."

