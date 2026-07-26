# Deploiement VPS - KVN Footwear

Le projet est installe dans `/var/www/kvn-footwear` et publie localement par Docker sur `127.0.0.1:3000`. Nginx gere le domaine et HTTPS.

## 1. Variables de production et secret JWT

Ne jamais commiter `.env.production`. Les identifiants admin sont stockes dans MySQL avec un hash bcrypt et ne figurent plus dans ce fichier.

```bash
cd /var/www/kvn-footwear
nano .env.production
```

Verifier que ces variables existent avec de vraies valeurs fortes :

```dotenv
MYSQL_DATABASE=kvn_footwear
MYSQL_USER=kvn_user
MYSQL_PASSWORD=mot_de_passe_mysql_fort
MYSQL_ROOT_PASSWORD=mot_de_passe_root_mysql_fort
DATABASE_URL=mysql://kvn_user:mot_de_passe_mysql_fort@mysql:3306/kvn_footwear

BACKUP_RETENTION_DAYS=14
```

Si le mot de passe MySQL contient des caracteres reserves dans une URL (`@`, `:`, `/`, `#`, `%`), les encoder dans `DATABASE_URL`.

Le JWT admin est signe avec un Docker secret, jamais avec une variable de `.env.production` :

```bash
cd /var/www/kvn-footwear
install -d -m 700 secrets
umask 077
openssl rand -hex 32 > secrets/admin_jwt_secret
```

## 2. Mettre a jour et lancer

```bash
cd /var/www/kvn-footwear
git pull --ff-only
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl -I http://127.0.0.1:3000
```

Apres la premiere migration vers l'authentification en base, creer le premier administrateur. Le mot de passe est saisi sans s'afficher et n'est ni enregistre dans l'historique du shell ni conserve dans `.env.production` :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec app npm run admin:create -- --email admin@kvnfootwear.ma
```

Supprimer ensuite les anciennes lignes `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` de `.env.production` si elles sont encore presentes. Le mot de passe peut ensuite etre modifie directement depuis le back-office.

Les migrations Prisma sont appliquees automatiquement au demarrage de l'application. Le seed reste une operation manuelle et n'ajoute que les donnees initiales manquantes :

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec app npm run db:seed
```

## 3. Installer la sauvegarde toutes les 24 heures

Le timer systemd lance un dump MySQL compresse une fois par jour, verifie l'archive et conserve 14 jours par defaut.

```bash
cd /var/www/kvn-footwear
chmod 0750 deploy/backup-db.sh deploy/install-backup-timer.sh
./deploy/install-backup-timer.sh
```

Verifier le timer et les sauvegardes :

```bash
systemctl list-timers kvn-footwear-backup.timer
journalctl -u kvn-footwear-backup.service --since today --no-pager
ls -lh /var/backups/kvn-footwear
gzip -t /var/backups/kvn-footwear/kvn_footwear_*.sql.gz
```

Lancer une sauvegarde immediate :

```bash
systemctl start kvn-footwear-backup.service
systemctl status kvn-footwear-backup.service --no-pager
```

## 4. Restaurer une sauvegarde

La restauration remplace les tables actuelles. Faire d'abord une nouvelle sauvegarde et choisir explicitement le fichier a restaurer.

```bash
cd /var/www/kvn-footwear
BACKUP_FILE=/var/backups/kvn-footwear/kvn_footwear_YYYY-MM-DDTHH-MM-SSZ.sql.gz
gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml --env-file .env.production exec -T mysql sh -ceu 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --host=127.0.0.1 --user="$MYSQL_USER" "$MYSQL_DATABASE"'
```

## 5. Reinitialiser completement la base

Cette operation supprime toutes les commandes, produits et configurations, puis reapplique les migrations, le seed et recree le compte administrateur. Une sauvegarde verifiee est obligatoire et automatique avant la suppression.

Verifier d'abord les etapes sans modifier la base :

```bash
cd /var/www/kvn-footwear
chmod 0750 deploy/reset-db.sh
./deploy/reset-db.sh \
  --admin-email admin@kvnfootwear.ma \
  --confirm RESET-KVN-FOOTWEAR \
  --dry-run
```

Executer reellement le reset uniquement lorsque la perte des donnees courantes est voulue :

```bash
./deploy/reset-db.sh \
  --admin-email admin@kvnfootwear.ma \
  --confirm RESET-KVN-FOOTWEAR
```

Le nouveau mot de passe admin est demande sans s'afficher. Si une etape echoue apres la suppression, l'application reste arretee afin de ne pas servir une base incomplete.

## 6. Verification apres deploiement

```bash
curl -I https://kvnfootwear.ma
curl -I https://kvnfootwear.ma/admin/dashboard
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 app
```

Sans cookie admin valide, `/admin/dashboard` doit rediriger vers `/admin/login` et les API privees doivent repondre `401`.
