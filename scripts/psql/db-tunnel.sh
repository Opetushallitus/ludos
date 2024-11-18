#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

function create_tunnel {
  assert_env_var_is_set "ENV"
  assert_env_var_is_set "USERNAME"
  assert_env_var_is_set "PGPASSWORD"
  export SSH_TUNNEL_PORT=40077

  function wait_for_pg_isready {
    echo "Waiting for pg connection to be ready..."
    while ! pg_isready -h 127.0.0.1 -p ${SSH_TUNNEL_PORT} -U "${USERNAME}" -d "ludos" 2>/dev/null; do
      sleep 2
    done
  }

  function start_db_tunnel {
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" up --build --detach --wait || {
      docker-compose -f "${repo}/scripts/psql/docker-compose.yml" logs && exit 1
    }
    wait_until_port_is_listening "${SSH_TUNNEL_PORT}"
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" logs
  }

  function stop_db_tunnel {
    echo "Stopping tunnel...."
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" down
  }

  eval "require_aws_session_for_${ENV}"
  start_db_tunnel
  trap stop_db_tunnel EXIT
  wait_for_pg_isready
}