#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/db-tunnel.sh"

function initialize {
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

  function initialize_credentials {
    ENV_NAME_FIRST_LETTER_CAPITALIZED=${ENV^}
    SECRET_NAME="/${ENV_NAME_FIRST_LETTER_CAPITALIZED}LudosStack/DbStack/DatabaseMasterPassword"
    USERNAME=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".username")
    PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id "${SECRET_NAME}" --query "SecretString" --output text | jq -r ".password")
    export PGPASSWORD
  }

  require_command psql
  require_command aws
  assert_psqlrc
  parse_env_from_script_name "psql-ludos"
  assert_bash_version

  eval "require_aws_session_for_${ENV}"
  initialize_credentials
}

function main {
  initialize
  create_tunnel

  echo "Connecting to DB 'ludos' on ${ENV}"
  psql -h 127.0.0.1 -p "${SSH_TUNNEL_PORT}" -U "${USERNAME}" -d "ludos"
}

main "$@"
