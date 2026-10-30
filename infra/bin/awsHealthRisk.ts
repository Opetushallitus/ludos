#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { accounts } from '../lib/accounts'
import { AWS_HEALTH_RISK_REGIONS, AwsHealthRiskStack } from '../lib/awsHealthRiskStack'

const app = new cdk.App()
const account = Object.values(accounts).find((candidate) => candidate.name === app.node.tryGetContext('account'))
if (!account) {
  throw new Error('Set --context account=dev|qa|prod|utility')
}
const enabled = String(app.node.tryGetContext('enabled') ?? 'false')
if (enabled !== 'true' && enabled !== 'false') {
  throw new Error('Set --context enabled=true|false')
}

for (const region of AWS_HEALTH_RISK_REGIONS) {
  new AwsHealthRiskStack(app, `AwsHealthRisk-${account.name}-${region}`, {
    env: { account: account.id, region },
    healthIntegrationUrl: process.env.AWS_HEALTH_RISK_PAGERDUTY_ENDPOINT ?? '',
    cloudwatchIntegrationUrl: process.env.PAGERDUTY_ENDPOINT ?? '',
    enabled: enabled === 'true'
  })
}
app.synth()
