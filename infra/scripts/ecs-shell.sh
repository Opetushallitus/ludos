#!/bin/bash

set -euo pipefail

ENV_NAME=${1:-}
case "$ENV_NAME" in
    "untuva")
        PROFILE="oph-ludos-dev"
        ENV_NAME_CAPITALIZED=Untuva
        ;;
    "qa")
        PROFILE="oph-ludos-qa"
        ENV_NAME_CAPITALIZED=Qa
        ;;
    *)
        echo "Usage: $0 <untuva|qa>"
        exit 1
        ;;
esac

CLUSTER="${ENV_NAME_CAPITALIZED}Cluster"

error() {
    echo "Error: $@" 1>&2
    exit 1
}

get_task_id() {
  aws --profile "$PROFILE" ecs list-tasks --cluster "$CLUSTER" --query 'taskArns[0]' --output text | cut -d '/' -f3
}

if ! TASK_ID=$(get_task_id) || [[ -z "$TASK_ID" ]] ; then
    error "Could not get task id"
fi
echo "Task id: '$TASK_ID'"

aws --profile "$PROFILE" ecs execute-command --cluster $CLUSTER --task "$TASK_ID" --container Container --interactive --command '/bin/sh'