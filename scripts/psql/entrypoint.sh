#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

ENV_NAME_FIRST_LETTER_CAPITALIZED=${ENV_NAME^}

echo "Searching for bastion from environment ${ENV_NAME_FIRST_LETTER_CAPITALIZED}"
BASTION_INSTANCE_ID=$(aws ec2 describe-instances \
                           --filter "Name=tag:Name,Values=${ENV_NAME_FIRST_LETTER_CAPITALIZED}Bastion" \
                           --query "Reservations[].Instances[?State.Name == 'running'].InstanceId[]" \
                           --output text)
if [[ -z "$BASTION_INSTANCE_ID" ]]; then
    echo "Could not find bastion instance"
    exit 1
fi
echo "Found bastion with instance id: '$BASTION_INSTANCE_ID'"

echo "Searching for DB from environment ${ENV_NAME}"
DB_HOSTNAME=$(aws rds describe-db-instances --query "DBInstances[?TagList[? Key == 'Environment' && Value == '${ENV_NAME}']].Endpoint.Address" --output text)
if [[ -z "$DB_HOSTNAME" ]]; then
    echo "Could not find DB instance"
    exit 1
fi
echo "Found DB with hostname: '$DB_HOSTNAME'"

daemonize -o /tmp/session-log /usr/bin/aws ssm start-session \
    --target "$BASTION_INSTANCE_ID" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "{\"host\":[\"${DB_HOSTNAME}\"],\"portNumber\":[\"5432\"], \"localPortNumber\":[\"5431\"]}"

echo "Created tunnel to AWS DB"

## AWS SSM is listening to the wrong interface, so lets fix that...
daemonize /usr/bin/socat \
  tcp-listen:5432,reuseaddr,fork \
  tcp:localhost:5431
echo "Exposed tunnel to correct interface"

tail -f /tmp/session-log
