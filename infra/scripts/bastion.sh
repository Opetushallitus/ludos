#!/bin/bash

ENV_NAME=$1
DB_HOSTNAME=""
LOCAL_PORT=""
case "$ENV_NAME" in
    "untuva")
        PROFILE="oph-ludos-dev"
        ENV_NAME_CAPITALIZED=Untuva
        LOCAL_PORT=5433
        ;;
    "qa")
        PROFILE="oph-ludos-qa"
        ENV_NAME_CAPITALIZED=Qa
        LOCAL_PORT=5435
        ;;
    "prod")
        PROFILE="oph-ludos-prod"
        ENV_NAME_CAPITALIZED=Prod
        LOCAL_PORT=5436
        ;;
    *)
        echo "Usage: $0 <untuva|qa> [DB_HOSTNAME] [LOCAL_PORT]"
        exit 1
        ;;
esac

error() {
    echo "Error: $*" 1>&2
    exit 1
}

if [[ $# -ge 2 ]]; then
  DB_HOSTNAME="$2"
  LOCAL_PORT=5431
fi

if [[ $# -ge 3 ]]; then
  LOCAL_PORT="$3"
fi

BASTION_INSTANCE_ID=$(aws --profile "$PROFILE" ec2 describe-instances \
                           --filter "Name=tag:Name,Values=${ENV_NAME_CAPITALIZED}Bastion" \
                           --query "Reservations[].Instances[?State.Name == 'running'].InstanceId[]" \
                           --output text)
if [[ "$?" != 0 || -z "$BASTION_INSTANCE_ID" ]]; then
    error "Could not get bastion instance id"
fi
echo "Bastion instance id: '$BASTION_INSTANCE_ID'"

if [[ -z "$DB_HOSTNAME" ]]; then
  DB_HOSTNAME=$(aws --profile "$PROFILE" rds describe-db-instances --query "DBInstances[?TagList[? Key == 'Environment' && Value == '${ENV_NAME}']].Endpoint.Address" --output text)
  if [[ "$?" != 0 || -z "$DB_HOSTNAME" ]]; then
      error "Could not get DB hostname"
  fi
fi
echo "DB hostname: '$DB_HOSTNAME'"

aws --profile "$PROFILE" ssm start-session --target "$BASTION_INSTANCE_ID" \
                       --document-name AWS-StartPortForwardingSessionToRemoteHost \
                       --parameters '{"host":["'"$DB_HOSTNAME"'"],"portNumber":["5432"],"localPortNumber":["'"$LOCAL_PORT"'"]}'