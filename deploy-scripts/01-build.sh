#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$repo/deploy-scripts/deploy-functions.sh"

# shellcheck source=./04-lint.sh
source "$repo/deploy-scripts/04-lint.sh"

# shellcheck source=./02-run-server-tests.sh
source "$repo/deploy-scripts/02-run-server-tests.sh"

# shellcheck source=./03-run-playwright-tests.sh
source "$repo/deploy-scripts/03-run-playwright-tests.sh"

# shellcheck source=./05-push-image.sh
source "$repo/deploy-scripts/05-push-image.sh"

function main {
  lint
  build
  test-server
  playwright-test
  push-image
}

function build {
  pushd "$repo"
  start_gh_actions_group "Building ludos-server"

  require_command docker
  require_docker_compose


  LUDOS_TAG="ludos-$revision"
  # if !running_on_gh_actions; then
  #   LUDOS_TAG=ludos-server:local
  # fi

  export LUDOS_TAG
  docker compose -f ./docker-compose.yaml build ludos-server
  end_gh_actions_group
  popd
}

main
