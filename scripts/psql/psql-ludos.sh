#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

function main {
  SSH_TUNNEL_PORT=40077

  function assert_bash_version {
    if ! (command -v echo "${ENV^}" > /dev/null); then
      echo "Bash version ${BASH_VERSION} not supported, upgrade to at least 4.x"
      echo "e.g. brew install bash"
      exit 1
    fi
  }

  function assert_psqlrc {
    export PSQLRC="${repo}/scripts/psql/psqlrc"
    if [ ! -f "$PSQLRC" ]; then echo "File $PSQLRC not found"; fi
  }

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
    echo "script is exiting, stopping tunnel"
    docker-compose -f "${repo}/scripts/psql/docker-compose.yml" down
  }

  function initialize_credentials {
    ENV_NAME_FIRST_LETTER_CAPITALIZED=${ENV^}
    SECRET_NAME="/${ENV_NAME_FIRST_LETTER_CAPITALIZED}LudosStack/DbStack/DatabaseMasterPassword"
    USERNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".username")
    PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".password")
    export PGPASSWORD
  }

  require_command jq
  require_command psql
  require_command aws
  assert_psqlrc
  parse_env_from_script_name "psql-ludos"
  assert_bash_version

  eval "require_aws_session_for_${ENV}"
  start_db_tunnel
  trap stop_db_tunnel EXIT

  echo "Connecting to DB 'ludos' on ${ENV}"
  initialize_credentials
  wait_for_pg_isready
  psql -h 127.0.0.1 -p ${SSH_TUNNEL_PORT} -U "${USERNAME}" -d "ludos"
}

main "$@"
