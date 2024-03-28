#!/bin/bash

SERVER_ENV="$(dirname "$0")/../ludos/server/.env"
PLAYWRIGHT_ENV="$(dirname "$0")/../ludos/playwright/.env"
FETCH_SECRETS_SCRIPT="$(dirname "$0")/../ludos/scripts/fetch_secrets.sh"

check_env_files() {
    if [[ ! -f "$SERVER_ENV" ]] || [[ ! -f "$PLAYWRIGHT_ENV" ]]; then
        return 1
    else
        return 0
    fi
}

if ! check_env_files; then
    echo "Secrets not found, logging in to AWS SSO.."
    aws --profile oph-ludos-dev sso login && aws --profile oph-ludos-utility sso login

    echo "running fetch-secrets.sh..."
    bash "$FETCH_SECRETS_SCRIPT"

    if ! check_env_files; then
        echo "Failed to fetch secrets. Please check the fetch_secrets.sh script and your AWS credentials."
        exit 1
    fi
fi

# Stop the existing containers
docker compose down

SESSION_NAME="dev-environment"

tmux new-session -d -s $SESSION_NAME -n database
tmux send-keys -t $SESSION_NAME "docker compose up" C-m

tmux split-window -v -t $SESSION_NAME
tmux send-keys -t $SESSION_NAME:0.1 "SPRING_PROFILES_ACTIVE=local server/gradlew bootRun -p server bootRun" C-m

tmux split-window -h -t $SESSION_NAME
tmux send-keys -t $SESSION_NAME:0.2 "yarn dev:web" C-m

tmux select-layout -t $SESSION_NAME tiled

tmux attach -t $SESSION_NAME
