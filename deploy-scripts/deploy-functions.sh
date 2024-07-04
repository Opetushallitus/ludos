#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# allow sourcing this file multiple times from different scripts
if [ -n "${DEPLOY_FUNCTIONS_SOURCED:-}" ]; then
  return
fi
readonly DEPLOY_FUNCTIONS_SOURCED="true"

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

readonly service_name="ludos"

readonly ecr_registry="505953557276.dkr.ecr.eu-west-1.amazonaws.com/${service_name}"
readonly ecr_image_tag="${ecr_registry}:${revision}"

readonly github_registry="ghcr.io/opetushallitus/${service_name}"
readonly github_image_tag="${github_registry}:${revision}"

readonly deploy_dist_dir="$repo/deploy-scripts/dist/"
mkdir -p "$deploy_dist_dir"

function image_exists_locally {
  local tag="$1"
  docker image inspect "$tag" &> /dev/null
}

function require_built_image {
  if image_exists_locally "${github_image_tag}"; then
    info "${github_image_tag} already exists locally"
  else
    info "Pulling ${github_image_tag} because it does not exist locally"
    docker pull "${github_image_tag}"
  fi
}
