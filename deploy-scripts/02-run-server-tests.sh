#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$repo/deploy-scripts/deploy-functions.sh"

function test-server {
  pushd "$repo"
  require_command docker
  require_docker_compose

  start_gh_actions_group "Start DB for tests"
  docker compose up ludos-db --detach
  end_gh_actions_group

  start_gh_actions_group "Building gradle server tests"
  docker compose -f ./docker-compose.yaml build ludos-server-stage
  end_gh_actions_group

  start_gh_actions_group "Running gradle server tests"
  pushd server
  if running_on_gh_actions; then
    docker run --env SPRING_PROFILES_ACTIVE=local \
    --env DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
    --network oph-ludos_default \
    server-stage \
    gradle test
  else
    docker run  --rm --env SPRING_PROFILES_ACTIVE=local \
    --env DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
    --network oph-ludos_default \
    server-stage \
    gradle test
  fi
  popd
  end_gh_actions_group


  start_gh_actions_group "Stop DB for tests"
  docker compose down ludos-db
  end_gh_actions_group
  popd
}
