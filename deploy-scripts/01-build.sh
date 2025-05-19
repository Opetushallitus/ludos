#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"


function main {
  require_command docker
  require_docker_compose

  cd "$repo"

  local tags_to_push=()

  start_gh_actions_group "Building $github_image_tag"

  LUDOS_TAG="$github_image_tag"
  # if !running_on_gh_actions; then
  #   LUDOS_TAG=ludos-server:local
  # fi

  export LUDOS_TAG
  docker buildx bake --load -f ./docker-compose.yaml ludos-server

  end_gh_actions_group

}

main
