#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/db-tunnel.sh"
# shellcheck source=scripts/psql/pg-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/pg-functions.sh"

function initialize {
  require_command psql
  assert_psqlrc
  parse_env_from_script_name "psql-ludos"
  eval "require_aws_session_for_${ENV}"
  initialize_pg_credentials
}

function connect_psql {
  echo "Connecting to DB 'ludos' on ${ENV}"
  psql -h 127.0.0.1 -p "${SSH_TUNNEL_PORT}" -U "${USERNAME}" -d "ludos"
}

function main {
  initialize
  create_tunnel
  connect_psql
}

main "$@"
