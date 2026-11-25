#!/bin/bash
# Run this on the Nobus server itself, from the repo root (or anywhere,
# it finds its own way): pulls the latest code and rebuilds.
set -e
cd "$(dirname "$0")/.."
git pull
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
