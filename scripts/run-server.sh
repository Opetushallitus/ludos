#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  pushd "$repo"/server

  if [[ -z "${GITHUB_TOKEN+''}" ]]; then
    echo "You must set github personal access token to GITHUB_TOKEN env variable and export it"
    echo "Go to github: Your profile -> settings and find developer settings in the bottom (its kinda hidden)"
    echo "Then create classic token that has read:packages"
    echo "NO SOUP FOR YOU"
    exit 1
  fi

  docker compose -f "$repo"/docker-compose-run-server.yaml up

  popd
}

main
