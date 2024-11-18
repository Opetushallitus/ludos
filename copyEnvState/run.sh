#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"



function main {
  configure_aws_credentials

  docker build -t copyenvstate:latest -f ./Dockerfile.copyEnvState .

  docker run \
    --rm \
    --mount type=bind,source="${HOME}/.aws,target=/root/.aws,readonly" \
    -e AWS_PROFILE \
    -e AWS_REGION \
    -e AWS_DEFAULT_REGION \
    copyenvstate:latest
}

main