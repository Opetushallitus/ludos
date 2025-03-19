#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function main {
  start_gh_actions_group "Setup"
  parse_env_from_script_name "deploy"
  use_correct_node_version
  end_gh_actions_group

  start_gh_actions_group "Deploy $ENV"
  if [ $ENV = "untuva" ]; then
    deploy_untuva
  elif [ $ENV = "qa" ]; then
    deploy_qa
  elif [ $ENV = "prod" ]; then
    deploy_prod
  fi
  end_gh_actions_group
}

function deploy_untuva {
  require_aws_session_for_env utility
  image_tag=$(aws ecr describe-images --repository-name ludos | jq --raw-output ".imageDetails | sort_by(.imagePushedAt) | last | .imageTags[0]")
  require_aws_session_for_env dev
  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  IMAGE_TAG=$image_tag . "./cdk.sh" deploy --all
}

function deploy_qa {
  require_aws_session_for_env dev
  task_definition_arn=$(aws ecs list-task-definitions | jq --raw-output ".taskDefinitionArns[0]")
  task_container_image_arn=$(aws ecs describe-task-definition --task-definition "$task_definition_arn" | jq -r '.taskDefinition.containerDefinitions[0].image')
  task_image_tag=$(echo "$task_container_image_arn" | awk -F: '{print $2}')

  require_aws_session_for_env qa
  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  IMAGE_TAG=$task_image_tag . "./cdk.sh" deploy --all
}

function deploy_prod {
  require_aws_session_for_env qa
  task_definition_arn=$(aws ecs list-task-definitions | jq --raw-output ".taskDefinitionArns[0]")
  task_container_image_arn=$(aws ecs describe-task-definition --task-definition "$task_definition_arn" | jq -r '.taskDefinition.containerDefinitions[0].image')
  task_image_tag=$(echo "$task_container_image_arn" | awk -F: '{print $2}')

  require_aws_session_for_env prod
  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  IMAGE_TAG=$task_image_tag . "./cdk.sh" deploy --all
}


main
