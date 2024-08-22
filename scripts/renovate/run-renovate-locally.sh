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
    renovate/renovate --dry-run=lookup
  popd
}

main