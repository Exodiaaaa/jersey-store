#!/usr/bin/env bash
set -Eeuo pipefail

app_dir="/var/www/kvn-footwear"

if (( EUID != 0 )); then
  echo "Ce script doit etre lance avec root ou sudo." >&2
  exit 1
fi

if [[ ! -x "${app_dir}/deploy/backup-db.sh" ]]; then
  chmod 0750 "${app_dir}/deploy/backup-db.sh"
fi

install -m 0644 "${app_dir}/deploy/kvn-footwear-backup.service" /etc/systemd/system/kvn-footwear-backup.service
install -m 0644 "${app_dir}/deploy/kvn-footwear-backup.timer" /etc/systemd/system/kvn-footwear-backup.timer

systemctl daemon-reload
systemctl enable --now kvn-footwear-backup.timer
systemctl start kvn-footwear-backup.service
systemctl --no-pager --full status kvn-footwear-backup.service
systemctl --no-pager list-timers kvn-footwear-backup.timer
