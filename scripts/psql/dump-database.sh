#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/db-tunnel.sh"
# shellcheck source=scripts/psql/pg-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/pg-functions.sh"

function initialize {
  parse_env_from_script_name "dump-database"
  eval "require_aws_session_for_${ENV}"
  initialize_pg_credentials
  create_dump_directory
}

function dump_database {
  echo "Dumping database ${ENV} to ${CURRENT_EXEC_DIR}"
  mkdir "${CURRENT_EXEC_DIR}/database"

  docker run --rm \
    --net=host \
    --mount type=bind,source="${CURRENT_EXEC_DIR}/database",target=/tmp/dump_directory \
    -e PGPASSWORD="${PGPASSWORD}" \
    postgres:17.1 \
    pg_dump -h 127.0.0.1 -p "${SSH_TUNNEL_PORT}" -U "${USERNAME}" -d "ludos" -b -Fc -f /tmp/dump_directory/db-dump.custom
}

function create_dump_directory {
  mkdir -p "${repo}/scripts/psql/state"
  CURRENT_EXEC_DIR=$(mktemp -d "${repo}/scripts/psql/state/run-XXXXXX")
}

function main() {
  initialize
  create_tunnel
  dump_database
}

main "$@"