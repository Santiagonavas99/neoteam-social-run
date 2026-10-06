#!/usr/bin/env bash
# Runs each supabase/tests/*.sql in a throwaway database inside the compose `db` service.
# A test pulls in the migrations it needs with `\ir ../migrations/<file>.sql`.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose up -d --wait db >/dev/null

status=0
for test in supabase/tests/*.sql; do
  [ -e "$test" ] || continue
  db="test_$(basename "$test" .sql | tr -c 'a-z0-9_\n' '_')"
  docker compose exec -T -e PGOPTIONS=--client-min-messages=warning db psql -h localhost -U postgres -q -c "drop database if exists $db" -c "create database $db"
  if docker compose exec -T -e PGOPTIONS=--client-min-messages=warning -w /work db psql -h localhost -U postgres -d "$db" -q -v ON_ERROR_STOP=1 -f "/work/$test"; then
    echo "ok   $test"
  else
    echo "FAIL $test"
    status=1
  fi
  docker compose exec -T -e PGOPTIONS=--client-min-messages=warning db psql -h localhost -U postgres -q -c "drop database $db"
done
exit $status
