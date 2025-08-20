#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  pushd "$repo"/server

  docker compose -f "$repo"/docker-compose-run-server.yaml up --watch

  popd
}

main
