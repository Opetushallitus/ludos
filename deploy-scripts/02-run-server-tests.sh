#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"


function main {
  cd "$repo"
  require_command docker
  require_docker_compose
  configure_aws_credentials

  start_gh_actions_group "Build required web bundle"
  "$repo"/scripts/build-web.sh
  end_gh_actions_group

  start_gh_actions_group "Start DB for tests"
  docker compose up ludos-db --detach
  end_gh_actions_group

  start_gh_actions_group "Running gradle server tests"
  pushd server
  ./gradlew test --rerun-tasks
  popd
  end_gh_actions_group
}

main
