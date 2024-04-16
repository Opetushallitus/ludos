#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  pushd "$repo"/server
  "$repo"/scripts/build-web.sh
  docker compose -f "$repo"/docker-compose-build-server.yaml up
  popd
}

main
