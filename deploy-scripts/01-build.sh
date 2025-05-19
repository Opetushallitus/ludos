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
  docker_compose -f ./docker-compose.yaml build ludos-server
  tags_to_push+=("$github_image_tag")

  end_gh_actions_group

  if [ -n "${GITHUB_REF_NAME:-}" ]; then
    # Github refs often have slashes, which are not allowed in tag names
    # https://github.com/opencontainers/distribution-spec/blob/main/spec.md#pulling-manifests
    readonly clean_ref_name="${GITHUB_REF_NAME//[!a-zA-Z0-9._-]/-}"
    readonly ref_tag="$github_registry:$clean_ref_name"
    info "Tagging as $ref_tag"
    docker tag "$github_image_tag" "$ref_tag"
    tags_to_push+=("$ref_tag")
  fi

  if running_on_gh_actions; then
    start_gh_actions_group "Pushing tags"
    for tag in "${tags_to_push[@]}"
    do
      info "docker push $tag"
      # docker push "$tag"
    done
    end_gh_actions_group
  else
    info "Not pushing tags when running locally"
  fi
}

main
