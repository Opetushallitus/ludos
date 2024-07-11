#!/usr/bin/env bash
set -e

EVENT_ACTION=$1
DEDUP_KEY=$2
SUMMARY=$3
GITHUB_WORKFLOW_URL=https://github.com/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID

body() {
cat <<EOF
{
  "routing_key": "$1",
  "dedup_key": "$DEDUP_KEY",
  "event_action": "$EVENT_ACTION",
  "payload": {
    "summary": "$SUMMARY",
    "source": "ludos",
    "severity": "info"
  },
  "links": [
    {
      "href": "$GITHUB_WORKFLOW_URL",
      "text": "Github Actions Workflow"
    }
  ]
}
EOF
}

curl -H "Content-Type: application/json" -X POST -d "$(body "$PAGERDUTY_ROUTING_KEY")" https://events.pagerduty.com/v2/enqueue

