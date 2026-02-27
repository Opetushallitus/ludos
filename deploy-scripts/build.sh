#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$repo/deploy-scripts/deploy-functions.sh"

function main {
  build
}

function build {
  pushd "$repo"
  start_gh_actions_group "Building ludos-server"

  require_command docker
  require_docker_compose

  LUDOS_TAG="ludos-$revision"
  export LUDOS_TAG
  docker compose -f ./docker-compose.yaml build ludos-server
  end_gh_actions_group
  popd
}

main
