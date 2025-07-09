#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$repo/deploy-scripts/deploy-functions.sh"

function push-image() {
  setup
  upload_image_to_ecr
}

function upload_image_to_ecr() {
  start_gh_actions_group "Uploading image to util account"

  docker tag "ludos-$revision" "$ecr_image_tag"
  docker push "$ecr_image_tag"

  end_gh_actions_group
}

function setup() {
  pushd "${repo}"
  require_command docker
  require_docker_compose
  configure_aws_credentials
  get_ecr_login_credentials
  popd
}

function get_ecr_login_credentials() {
  if [[ "${CI:-}" = "true" ]]; then
    aws \
      ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 505953557276.dkr.ecr.eu-west-1.amazonaws.com
  else
    aws --profile oph-ludos-utility \
      ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 505953557276.dkr.ecr.eu-west-1.amazonaws.com
  fi
}
