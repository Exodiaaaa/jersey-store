# Deploiement professionnel - KVN Footwear

La production ne clone pas le depot prive. GitHub Actions valide le projet, construit une image Docker immuable, la publie dans le registre prive GHCR puis deploie cette image sur le VPS par SSH.

## Architecture

```text
push main
  -> lint + TypeScript + tests
  -> build Docker linux/amd64
  -> ghcr.io/exodiaaaa/jersey-store:<commit>
  -> sauvegarde MySQL
  -> deploiement SSH
  -> controle de sante
  -> rollback automatique de l'image en cas d'echec
```

Le VPS conserve uniquement :

- `/var/www/kvn-footwear/docker-compose.deploy.yml` ;
- `/var/www/kvn-footwear/.env.production` ;
- `/var/www/kvn-footwear/.release.env` ;
- `/var/www/kvn-footwear/secrets/admin_jwt_secret` ;
- les scripts d'exploitation dans `/var/www/kvn-footwear/deploy` ;
- les volumes Docker MySQL et les sauvegardes dans `/var/backups/kvn-footwear`.

Il ne conserve ni depot Git, ni cle GitHub donnant acces au code, ni token GHCR permanent.

## 1. Bootstrap du VPS

Depuis le PC, creer l'archive bootstrap depuis le depot :

```powershell
tar -czf "$env:TEMP\kvn-footwear-bootstrap.tar.gz" `
  docker-compose.deploy.yml `
  deploy/bootstrap-vps.sh `
  deploy/backup-db.sh `
  deploy/install-backup-timer.sh `
  deploy/kvn-footwear-backup.service `
  deploy/kvn-footwear-backup.timer `
  deploy/nginx-kvn-footwear.conf `
  deploy/remote-deploy.sh

scp "$env:TEMP\kvn-footwear-bootstrap.tar.gz" ubuntu@VPS_IP:/tmp/
```

Sur le VPS :

```bash
install -d -m 700 /tmp/kvn-bootstrap
tar -xzf /tmp/kvn-footwear-bootstrap.tar.gz -C /tmp/kvn-bootstrap
sudo bash /tmp/kvn-bootstrap/deploy/bootstrap-vps.sh
```

Le bootstrap installe Docker, Compose, Nginx, Certbot et le pare-feu. Les mots de passe MySQL et le secret JWT sont generes directement sur le VPS et ne sont jamais envoyes a GitHub.

## 2. Cle SSH reservee a GitHub Actions

Creer une cle dediee sur le PC. Ne pas reutiliser la cle personnelle :

```powershell
ssh-keygen -t ed25519 -C "github-actions-kvn-footwear" -f "$env:TEMP\kvn_github_actions"
```

Laisser la passphrase vide. Ajouter le contenu de `kvn_github_actions.pub` dans `/home/ubuntu/.ssh/authorized_keys` sur le VPS :

```bash
install -d -o ubuntu -g ubuntu -m 700 /home/ubuntu/.ssh
nano /home/ubuntu/.ssh/authorized_keys
chown ubuntu:ubuntu /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys
```

Le compte `ubuntu` doit pouvoir utiliser `sudo` sans interaction, comme dans l'installation OVH par defaut.

## 3. Environnement GitHub `production`

Dans **Settings > Environments > New environment**, creer `production`, puis ajouter :

Variables :

```text
VPS_HOST=141.94.222.188
VPS_USER=ubuntu
```

Secrets :

```text
VPS_SSH_PRIVATE_KEY  contenu complet de kvn_github_actions
VPS_KNOWN_HOSTS      cle hote publique lue directement sur le VPS
```

La valeur fiable de `VPS_KNOWN_HOSTS` se genere sur le VPS avec :

```bash
awk '{print "141.94.222.188 "$1" "$2}' /etc/ssh/ssh_host_ed25519_key.pub
```

Le `GITHUB_TOKEN` temporaire fourni automatiquement par GitHub Actions publie et telecharge l'image privee. Le workflow effectue `docker logout` apres chaque deploiement : aucun token GHCR longue duree n'est conserve sur le VPS.

## 4. Premier deploiement

Pousser sur `main` ou lancer manuellement **Actions > Production > Run workflow**. La configuration se trouve dans `.github/workflows/production.yml`.

Apres le premier deploiement, initialiser les donnees et creer l'administrateur :

```bash
cd /var/www/kvn-footwear

docker compose \
  -f docker-compose.deploy.yml \
  --env-file .env.production \
  --env-file .release.env \
  exec app npm run db:seed

docker compose \
  -f docker-compose.deploy.yml \
  --env-file .env.production \
  --env-file .release.env \
  exec app npm run admin:create -- --email admin@kvnfootwear.ma
```

Le mot de passe admin est saisi de maniere interactive, n'est pas affiche et est stocke uniquement sous forme de hash bcrypt dans MySQL.

## 5. DNS et HTTPS

Configurer chez le fournisseur DNS :

```text
A  @    141.94.222.188
A  www  141.94.222.188
```

Une fois la propagation confirmee :

```bash
certbot --nginx \
  -d kvnfootwear.ma \
  -d www.kvnfootwear.ma \
  --redirect
```

## 6. Sauvegardes

Le premier deploiement active automatiquement `kvn-footwear-backup.timer`. Le timer cree chaque jour un dump MySQL compresse et verifie, conserve 14 jours par defaut.

```bash
systemctl list-timers kvn-footwear-backup.timer
systemctl start kvn-footwear-backup.service
systemctl status kvn-footwear-backup.service --no-pager
ls -lh /var/backups/kvn-footwear
```

## 7. Verification et rollback

```bash
cd /var/www/kvn-footwear

docker compose \
  -f docker-compose.deploy.yml \
  --env-file .env.production \
  --env-file .release.env \
  ps

curl -I http://127.0.0.1:3000
curl -I https://kvnfootwear.ma
```

Chaque image est marquee par le SHA Git complet. Si le nouveau conteneur ne repond pas, `deploy/remote-deploy.sh` remet automatiquement la reference d'image precedente et redemarre l'application. La sauvegarde MySQL creee avant chaque mise a jour permet une restauration manuelle si une migration de base doit etre annulee.
