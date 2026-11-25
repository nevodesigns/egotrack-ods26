# deploy

Three containers: `db` (Postgres 16), `app` (the built server, which also serves the web app), `caddy` (automatic HTTPS).

## First time on the server

```
git clone https://github.com/nevodesigns/egotrack-ods26.git
cd egotrack-ods26
cp .env.example .env
nano .env   # fill in real values yourself; see the comments in the file
bash deploy/deploy.sh
```

`APP_DOMAIN` should be the server's public IP written as a sslip.io name, for example `102-209-47-247.sslip.io` for the IP `102.209.47.247` (dots become dashes), unless the free .com.ng domain has been issued. `APP_URL` is the same thing with `https://` in front.

## Every deploy after that

```
bash deploy/deploy.sh
```

Pulls the latest commit and rebuilds only what changed.

## Checking it

```
curl http://localhost:8787/health
docker compose -f deploy/docker-compose.yml logs -f app
```
