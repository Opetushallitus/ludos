#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../common-functions.sh"

TOKEN="redacted"

function main() {

  pushd ${repo}
  docker run \
    -e RENOVATE_TOKEN=${TOKEN} \
    -e LOG_LEVEL=debug \
    -e RENOVATE_AUTODISCOVER=true \
    -e RENOVATE_REPOSITORIES="Opetushallitus/ludos" \
    -e RENOVATE_AUTODISCOVER_FILTER="Opetushallitus/ludos" \
    -e RENOVATE_ALLOWED_COMMANDS="cd server && ./gradlew dependencies --write-locks" \
    renovate/renovate:41-full --dry-run=lookup
  popd
}

main