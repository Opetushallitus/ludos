#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../common-functions.sh"

TOKEN="redacted"

function main() {

  pushd ${repo}
  docker run \
    -v ${repo}/.github/renovate.json:/usr/src/app/renovate.json \
    -v ${repo}/scripts/renovate/config.js:/usr/src/app/config.js \
    -e RENOVATE_TOKEN=${TOKEN} \
    -e LOG_LEVEL=debug \
    -e RENOVATE_AUTODISCOVER=true \
    renovate/renovate --dry-run=lookup
  popd
}

main