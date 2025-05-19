#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"


function cleanup {
    docker compose down
}

function playwright_test {
  docker run -it --rm \
    --network oph-ludos_default \
    --env HEADLESS=true \
    --env CI=true \
    playwright-image "$@"
}


function main {
  cd "$repo"
  require_command docker
  require_docker_compose
  configure_aws_credentials
  trap cleanup EXIT

  start_gh_actions_group "Start service for tests"
  docker compose up ludos-db --detach
  end_gh_actions_group

  start_gh_actions_group "Run ludos server"
  LUDOS_TAG="$github_image_tag"
  export LUDOS_TAG


  docker buildx bake --load -f ./docker-compose.yaml ludos

  SPRING_PROFILES_ACTIVE=local \
  DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
  docker_compose up --wait ludos
  end_gh_actions_group

  start_gh_actions_group "Running non-parallel playwright tests"
  docker build -t playwright-image -f Dockerfile.playwright --build-arg="PLAYWRIGHT_VERSION=$(get_playwright_version)" .

  docker run --rm \
   --network oph-ludos_default \
   --env HEADLESS=true \
   --env CI=true \
   playwright-image --project non_parallel_tests
  end_gh_actions_group

  start_gh_actions_group "Running parallel playwright tests"
  docker run --rm \
   --network oph-ludos_default \
   --env HEADLESS=true \
   --env CI=true \
   playwright-image --project parallel_tests --workers 4
  end_gh_actions_group

  start_gh_actions_group "Running download playwright tests"
  docker run --rm \
  --network oph-ludos_default \
  --env HEADLESS=true \
  --env CI=true \
  playwright-image --project download_test_webkit
  end_gh_actions_group

  start_gh_actions_group "Stop service for tests"
  cleanup
  end_gh_actions_group
}

main
