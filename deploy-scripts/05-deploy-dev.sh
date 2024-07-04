#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function main() {
  parse_env_from_script_name 05-deploy
  setup

  start_gh_actions_group "Deploying to ${ENV}"
  upload_image_to_ecr
}

function upload_image_to_ecr() {
  require_built_image

  docker tag "${github_image_tag}" "${ecr_image_tag}"
  docker push "${ecr_image_tag}"
}

function setup() {
  cd "${repo}"
  require_command docker
  require_docker_compose
  configure_aws_credentials
  get_ecr_login_credentials
}

function get_ecr_login_credentials() {
  aws --profile oph-ludos-utility \
  ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 505953557276.dkr.ecr.eu-west-1.amazonaws.com
}

main "$@"