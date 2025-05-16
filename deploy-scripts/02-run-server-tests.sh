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

  start_gh_actions_group "Start DB for tests"
  docker_compose up ludos-db --detach
  end_gh_actions_group

  start_gh_actions_group "Running gradle server tests"

  docker_compose -f ./docker-compose.yaml build ludos-server-stage
  pushd server
  if running_on_gh_actions; then
    docker run --env SPRING_PROFILES_ACTIVE=local \
    --env DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
    --env AWS_ACCESS_KEY_ID \
    --env AWS_SECRET_ACCESS_KEY \
    --env AWS_SESSION_TOKEN \
    --env AWS_REGION \
    --env AWS_DEFAULT_REGION \
    --network oph-ludos_default \
    server-stage \
    gradle test
  else
    docker run  --rm --env SPRING_PROFILES_ACTIVE=local \
    --env DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
    --volume "${HOME}/.aws:/root/.aws" -v "$( pwd ):/aws" \
    --network oph-ludos_default \
    server-stage \
    gradle test
  fi
  popd
  end_gh_actions_group


  start_gh_actions_group "Stop DB for tests"
  docker compose down ludos-db
  end_gh_actions_group
}

main
