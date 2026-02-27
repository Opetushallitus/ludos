#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$repo/deploy-scripts/deploy-functions.sh"

function cleanup {
    docker compose down
}

function playwright_prepare_env {
  pushd "$repo"
  require_command docker
  require_docker_compose

  start_gh_actions_group "Start service for tests"
  docker compose up ludos-db --detach
  end_gh_actions_group

  start_gh_actions_group "Run ludos server"
  LUDOS_TAG="ludos-$revision"
  export LUDOS_TAG


  SPRING_PROFILES_ACTIVE=local \
  DB_URL=jdbc:postgresql://ludos-db:5432/ludos \
  docker compose up --wait ludos
  end_gh_actions_group

  start_gh_actions_group "Build playwright image"
  docker build -t playwright-image -f Dockerfile.playwright --build-arg="PLAYWRIGHT_VERSION=$(get_playwright_version)" .
  end_gh_actions_group
}

function playwright_run_parallel_shard {
  local shard_index="$1"
  local shard_total="$2"
  start_gh_actions_group "Running parallel playwright tests shard ${shard_index}/${shard_total}"
  docker run --rm \
   --network oph-ludos_default \
   --env HEADLESS=true \
   --env CI=true \
   -v ./playwright:/playwright \
   playwright-image --project parallel_tests --workers 1 --shard "${shard_index}/${shard_total}"
  end_gh_actions_group
}

function playwright_run_non_parallel_tests {
  start_gh_actions_group "Running non-parallel playwright tests"
  docker run --rm \
   --network oph-ludos_default \
   --env HEADLESS=true \
   --env CI=true \
   -v ./playwright:/playwright \
   playwright-image --project non_parallel_tests
  end_gh_actions_group
}

function playwright_run_download_test_webkit {
  start_gh_actions_group "Running download playwright tests"
  docker run --rm \
  --network oph-ludos_default \
  --env HEADLESS=true \
  --env CI=true \
  -v ./playwright:/playwright \
  playwright-image --project download_test_webkit
  end_gh_actions_group
}

function playwright_run_serial_suites {
  playwright_run_non_parallel_tests
  playwright_run_download_test_webkit
}

function playwright_cleanup {
  start_gh_actions_group "Stop service for tests"
  cleanup
  end_gh_actions_group
}

function playwright-test {
  playwright_prepare_env
  trap 'playwright_cleanup; popd' EXIT
  playwright_run_non_parallel_tests
  playwright_run_parallel_shard 1 1
  playwright_run_download_test_webkit
}
