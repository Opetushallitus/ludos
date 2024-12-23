#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../deploy-functions.sh"

function main() {
  require_aws_session_for_env dev

  LUDOS_PALVELUKAYTTAJA_JSON=$(aws --profile oph-ludos-dev secretsmanager get-secret-value --secret-id /UntuvaLudosStack/LudosApplicationStack/OphServiceUserCredentials --query 'SecretString' | jq -r .)
  export LUDOS_PALVELUKAYTTAJA_USERNAME="$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .username)"
  export LUDOS_PALVELUKAYTTAJA_PASSWORD="$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .password)"
  export LUDOS_TAG="$github_image_tag"

  ../03-run-playwright-tests.sh
}

main
