# AWS Health RISK → PagerDuty

Standalone, operator-run CDK app, matching the `rcs-common/infra/account-security` collector.
Deploy once per **account**: `dev` (both untuva and hahtuva), `qa`, `prod`, `utility`.
It is deliberately separate from application deploys and does not expand CI permissions.

## Prerequisites

On each account's existing PagerDuty service, create an **AWS Health Dashboard** integration
(PagerDuty EU vendor ID `PZGYQKH`). Do not reuse the CloudWatch integration or an Events v2 URL.
Store its full Integration URL in Secrets Manager in **eu-west-1** as
`/monitoring/aws-health-risk/pagerduty-integration-url`.

The existing CloudWatch Integration URL is read from `/pagerduty/event_url`.
Create that secret too if it is missing (notably check utility).
URLs must be distinct, of the form `https://events.eu.pagerduty.com/integration/<key>/enqueue`.
The CloudWatch endpoint may also use `events.pagerduty.com`.

## Deploy

Use the account's SSO AdministratorAccess profile, not the restricted application CI role.
From `infra/` in Bash, repeat for each account:

```bash
npm ci --ignore-scripts=true
ACCOUNT=dev # then qa, prod, utility
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
export AWS_PROFILE="oph-ludos-$ACCOUNT"
aws sso login --profile "$AWS_PROFILE"
# The regions the OPH SCP allows; keep in sync with AWS_HEALTH_RISK_REGIONS in lib/awsHealthRiskStack.ts.
AWS_HEALTH_RISK_REGIONS="eu-central-1 eu-north-1 eu-west-1 us-east-1"
export AWS_HEALTH_RISK_PAGERDUTY_ENDPOINT="$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id /monitoring/aws-health-risk/pagerduty-integration-url --query SecretString --output text)"
export PAGERDUTY_ENDPOINT="$(aws secretsmanager get-secret-value --region eu-west-1 --secret-id /pagerduty/event_url --query SecretString --output text)"

# Bootstrap any regions that do not already have the standard CDK bootstrap stack.
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
for REGION in $AWS_HEALTH_RISK_REGIONS; do
  npx --no-install cdk --app= bootstrap "aws://$ACCOUNT_ID/$REGION"
done

npx --no-install cdk --app 'npx tsx bin/awsHealthRisk.ts' diff --all -c account="$ACCOUNT"
npx --no-install cdk --app 'npx tsx bin/awsHealthRisk.ts' deploy --all -c account="$ACCOUNT"
```

The first deploy leaves rules **disabled**. Check both SNS subscriptions in every region are
confirmed (not `PendingConfirmation`), then enable collection:

```bash
for REGION in $AWS_HEALTH_RISK_REGIONS; do
  aws sns list-subscriptions --region "$REGION" --query "Subscriptions[?contains(TopicArn, ':aws-health-risk')].[TopicArn,SubscriptionArn]" --output table
done
npx --no-install cdk --app 'npx tsx bin/awsHealthRisk.ts' diff --all -c account="$ACCOUNT" -c enabled=true
npx --no-install cdk --app 'npx tsx bin/awsHealthRisk.ts' deploy --all -c account="$ACCOUNT" -c enabled=true
unset AWS_HEALTH_RISK_PAGERDUTY_ENDPOINT PAGERDUTY_ENDPOINT
```

Pass `-c enabled=true` on subsequent deploys too; omitting it disables collection.
The collectors cover the four regions the OPH organization's SCP allows (`AWS_HEALTH_RISK_REGIONS`
in `lib/awsHealthRiskStack.ts`), including us-east-1, where global events such as exposed credentials
arrive. If the SCP starts allowing another region, add it there and deploy again.
Do not remove previously deployed regions from the deployment inventory; CDK does not delete
stacks omitted from a later invocation.

## Delivery and limitations

Each region has an EventBridge rule → SNS → PagerDuty, with the original event
inside the SNS envelope. No event type code/category restriction is applied: all Health
`detail.service = RISK` events are included, except `detail.backupEvent = "true"`.
AWS's backup copies are dropped because PagerDuty's Health integration creates a random
dedup key per delivery: a global event's us-west-2 copy would page twice. This sacrifices
backup-region redundancy; updates and retries may still create additional incidents.

Both delivery hops have encrypted, 14-day SQS dead-letter queues. Six CloudWatch alarms
cover queued failures and delivery/redrive failures, using a separate SNS topic and the
existing CloudWatch integration. Investigate `aws-health-risk-*-dlq` before messages expire.
Disabling rules does not delete queues or alarms.

The resolved integration URLs are credentials: they appear in the synthesized templates
and CloudFormation subscription endpoints. Do not publish `cdk.out/` or diff output.
No synthetic event is sent to the live PagerDuty service by the tests.
