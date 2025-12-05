#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {

  require_aws_session_for_env dev
  initialize_credentials

  pushd "$repo"
  DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
  SPRING_PROFILES_ACTIVE=local \
    docker compose up --build ludos
  popd
}

function initialize_credentials() {
  LUDOS_PALVELUKAYTTAJA_JSON=$(aws --profile oph-ludos-dev secretsmanager get-secret-value --secret-id /UntuvaLudosStack/LudosApplicationStack/OphServiceUserCredentials --query 'SecretString' | jq -r .)
  export "LUDOS_PALVELUKAYTTAJA_USERNAME=\"$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .username)\""
  export "LUDOS_PALVELUKAYTTAJA_PASSWORD=\"$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .password)\""
}

main
