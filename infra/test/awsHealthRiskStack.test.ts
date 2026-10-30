import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { accounts } from '../lib/accounts'
import { AWS_HEALTH_RISK_REGIONS, AwsHealthRiskStack } from '../lib/awsHealthRiskStack'

const healthIntegrationUrl = 'https://events.eu.pagerduty.com/integration/00000000000000000000000000000000/enqueue'
const cloudwatchIntegrationUrl = 'https://events.eu.pagerduty.com/integration/11111111111111111111111111111111/enqueue'
const props = {
  env: { account: accounts.dev.id, region: 'us-east-1' },
  healthIntegrationUrl,
  cloudwatchIntegrationUrl
}

test('collector preserves Health events, drops backup copies and starts disabled', () => {
  const template = Template.fromStack(new AwsHealthRiskStack(new cdk.App(), 'Test', props))
  template.resourceCountIs('AWS::Events::Rule', 1)
  template.hasResourceProperties('AWS::Events::Rule', {
    State: 'DISABLED',
    EventPattern: {
      source: ['aws.health'],
      detail: {
        service: ['RISK'],
        $or: [{ backupEvent: ['false'] }, { backupEvent: [{ exists: false }] }]
      }
    },
    Targets: [
      {
        Id: 'health-risk-sns',
        Arn: { Ref: Match.anyValue() },
        DeadLetterConfig: { Arn: { 'Fn::GetAtt': [Match.anyValue(), 'Arn'] } },
        RetryPolicy: { MaximumEventAgeInSeconds: 86400, MaximumRetryAttempts: 185 },
        Input: Match.absent(),
        InputTransformer: Match.absent()
      }
    ]
  })
  template.resourceCountIs('AWS::SQS::Queue', 2)
  template.allResourcesProperties('AWS::SQS::Queue', { MessageRetentionPeriod: 1209600, SqsManagedSseEnabled: true })
  template.resourceCountIs('AWS::SNS::Subscription', 2)
  template.hasResourceProperties('AWS::SNS::Subscription', {
    Endpoint: healthIntegrationUrl,
    Protocol: 'https',
    RawMessageDelivery: false,
    RedrivePolicy: { deadLetterTargetArn: { 'Fn::GetAtt': [Match.anyValue(), 'Arn'] } },
    DeliveryPolicy: { healthyRetryPolicy: Match.objectLike({ numRetries: 50 }) }
  })
  template.hasResourceProperties('AWS::SNS::Subscription', {
    Endpoint: cloudwatchIntegrationUrl,
    RawMessageDelivery: false,
    FilterPolicyScope: 'MessageBody',
    FilterPolicy: { AlarmName: [{ exists: true }] }
  })
  template.resourceCountIs('AWS::CloudWatch::Alarm', 6)
  template.allResourcesProperties('AWS::CloudWatch::Alarm', {
    ComparisonOperator: 'GreaterThanThreshold',
    EvaluationPeriods: 1,
    Period: 60,
    Threshold: 0,
    TreatMissingData: 'notBreaching',
    AlarmActions: [{ Ref: Match.anyValue() }],
    OKActions: [{ Ref: Match.anyValue() }]
  })
  const topicArn = {
    Ref: Object.keys(template.findResources('AWS::SNS::Topic', { Properties: { TopicName: 'aws-health-risk' } }))[0]
  }
  const failuresArn = {
    Ref: Object.keys(
      template.findResources('AWS::SNS::Topic', { Properties: { TopicName: 'aws-health-risk-failures' } })
    )[0]
  }
  template.hasResourceProperties('AWS::SNS::Subscription', { Endpoint: healthIntegrationUrl, TopicArn: topicArn })
  template.hasResourceProperties('AWS::SNS::Subscription', {
    Endpoint: cloudwatchIntegrationUrl,
    TopicArn: failuresArn
  })
  template.allResourcesProperties('AWS::CloudWatch::Alarm', { AlarmActions: [failuresArn], OKActions: [failuresArn] })
  const topicPolicy = Object.values(template.findResources('AWS::SNS::TopicPolicy'))[0].Properties.PolicyDocument
  assert.equal(topicPolicy.Statement.length, 1)
  assert.equal(topicPolicy.Statement[0].Principal.Service, 'events.amazonaws.com')
  assert.deepEqual(topicPolicy.Statement[0].Resource, topicArn)
  assert.deepEqual(topicPolicy.Statement[0].Condition.ArnEquals['aws:SourceArn'], {
    'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, `:events:us-east-1:${accounts.dev.id}:rule/aws-health-risk`]]
  })
  const queueStatements = Object.values(template.findResources('AWS::SQS::QueuePolicy'))[0].Properties.PolicyDocument
    .Statement
  assert.equal(queueStatements.length, 2)
  assert.equal(queueStatements[0].Principal.Service, 'events.amazonaws.com')
  assert.deepEqual(
    queueStatements[0].Condition.ArnEquals['aws:SourceArn'],
    topicPolicy.Statement[0].Condition.ArnEquals['aws:SourceArn']
  )
  assert.equal(queueStatements[1].Principal.Service, 'sns.amazonaws.com')
  assert.deepEqual(queueStatements[1].Condition.ArnEquals['aws:SourceArn'], topicArn)
})

test('collection can be enabled without changing the routing', () => {
  const template = Template.fromStack(new AwsHealthRiskStack(new cdk.App(), 'Test', { ...props, enabled: true }))
  template.hasResourceProperties('AWS::Events::Rule', { State: 'ENABLED' })
})

test('rejects missing, Events v2 and shared integration endpoints', () => {
  for (const overrides of [
    { healthIntegrationUrl: '' },
    { cloudwatchIntegrationUrl: '' },
    { healthIntegrationUrl: 'https://events.eu.pagerduty.com/v2/enqueue' },
    { cloudwatchIntegrationUrl: 'https://events.eu.pagerduty.com/v2/enqueue' },
    { cloudwatchIntegrationUrl: healthIntegrationUrl }
  ]) {
    assert.throws(() => new AwsHealthRiskStack(new cdk.App(), 'Test', { ...props, ...overrides }), /integration/i)
  }
})

test('standalone app covers all four accounts and every SCP-allowed region, without application infrastructure', () => {
  const outdir = mkdtempSync(path.join(tmpdir(), 'ludos-health-risk-'))
  try {
    for (const account of Object.values(accounts)) {
      const result = spawnSync(process.execPath, ['--import', 'tsx', 'bin/awsHealthRisk.ts'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          CDK_OUTDIR: outdir,
          CDK_CONTEXT_JSON: JSON.stringify({ account: account.name, enabled: 'true' }),
          AWS_HEALTH_RISK_PAGERDUTY_ENDPOINT: healthIntegrationUrl,
          PAGERDUTY_ENDPOINT: cloudwatchIntegrationUrl
        }
      })
      assert.equal(result.status, 0, result.stderr)
      const manifest = JSON.parse(readFileSync(path.join(outdir, 'manifest.json'), 'utf8'))
      const stacks = Object.values(manifest.artifacts).filter(
        (artifact): artifact is { type: string; environment: string } =>
          (artifact as { type: string }).type === 'aws:cloudformation:stack'
      )
      assert.deepEqual(
        stacks.map((stack) => stack.environment).sort(),
        AWS_HEALTH_RISK_REGIONS.map((region) => `aws://${account.id}/${region}`).sort()
      )
    }
    for (const context of [{ account: 'unknown' }, { account: 'dev', enabled: 'yes' }]) {
      const result = spawnSync(process.execPath, ['--import', 'tsx', 'bin/awsHealthRisk.ts'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          CDK_OUTDIR: outdir,
          CDK_CONTEXT_JSON: JSON.stringify(context)
        }
      })
      assert.notEqual(result.status, 0)
      assert.match(result.stderr, /Set --context/)
    }
  } finally {
    rmSync(outdir, { recursive: true, force: true })
  }
})
