import * as cdk from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as events from 'aws-cdk-lib/aws-events'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'

// The OPH organization's SCP denies every other region. us-east-1 receives global events such as
// exposed credentials; their us-west-2 copies are backups, which the rule drops anyway.
export const AWS_HEALTH_RISK_REGIONS = ['eu-central-1', 'eu-north-1', 'eu-west-1', 'us-east-1']

interface AwsHealthRiskStackProps extends cdk.StackProps {
  healthIntegrationUrl: string
  cloudwatchIntegrationUrl: string
  enabled?: boolean
}

export class AwsHealthRiskStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsHealthRiskStackProps) {
    super(scope, id, props)

    if (
      !/^https:\/\/events\.eu\.pagerduty\.com\/integration\/[A-Za-z0-9]+\/enqueue$/.test(props.healthIntegrationUrl)
    ) {
      throw new Error('Expected a PagerDuty EU AWS Health integration URL, not an Events v2 endpoint')
    }
    if (
      !/^https:\/\/events(\.eu)?\.pagerduty\.com\/integration\/[A-Za-z0-9]+\/enqueue$/.test(
        props.cloudwatchIntegrationUrl
      )
    ) {
      throw new Error('Expected a PagerDuty CloudWatch integration URL')
    }
    if (props.healthIntegrationUrl === props.cloudwatchIntegrationUrl) {
      throw new Error('Health events and failure alarms must use different PagerDuty integrations')
    }

    const topic = new sns.Topic(this, 'RiskTopic', { topicName: 'aws-health-risk' })
    const failures = new sns.Topic(this, 'FailuresTopic', { topicName: 'aws-health-risk-failures' })
    const eventbridgeDlq = new sqs.Queue(this, 'EventBridgeDlq', {
      queueName: 'aws-health-risk-eventbridge-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED
    })
    const snsDlq = new sqs.Queue(this, 'SnsDlq', {
      queueName: 'aws-health-risk-sns-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED
    })

    const ruleName = 'aws-health-risk'
    // Use the known ARN so the rule can depend on its policies without a CloudFormation cycle.
    const ruleArn = this.formatArn({ service: 'events', resource: 'rule', resourceName: ruleName })
    const topicPolicy = new sns.TopicPolicy(this, 'RiskTopicPolicy', {
      topics: [topic],
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            principals: [new iam.ServicePrincipal('events.amazonaws.com')],
            actions: ['sns:Publish'],
            resources: [topic.topicArn],
            conditions: { ArnEquals: { 'aws:SourceArn': ruleArn } }
          })
        ]
      })
    })
    const queuePolicy = new sqs.QueuePolicy(this, 'DlqPolicy', { queues: [eventbridgeDlq, snsDlq] })
    for (const [service, sourceArn, queue] of [
      ['events.amazonaws.com', ruleArn, eventbridgeDlq],
      ['sns.amazonaws.com', topic.topicArn, snsDlq]
    ] as const) {
      queuePolicy.document.addStatements(
        new iam.PolicyStatement({
          principals: [new iam.ServicePrincipal(service)],
          actions: ['sqs:SendMessage'],
          resources: [queue.queueArn],
          conditions: { ArnEquals: { 'aws:SourceArn': sourceArn } }
        })
      )
    }

    const healthSubscription = new sns.CfnSubscription(this, 'HealthSubscription', {
      topicArn: topic.topicArn,
      protocol: 'https',
      endpoint: props.healthIntegrationUrl,
      rawMessageDelivery: false,
      redrivePolicy: { deadLetterTargetArn: snsDlq.queueArn },
      deliveryPolicy: {
        healthyRetryPolicy: {
          minDelayTarget: 1,
          maxDelayTarget: 60,
          numRetries: 50,
          numNoDelayRetries: 3,
          numMinDelayRetries: 2,
          numMaxDelayRetries: 35,
          backoffFunction: 'exponential'
        }
      }
    })
    healthSubscription.node.addDependency(queuePolicy)
    const failureSubscription = new sns.CfnSubscription(this, 'FailureSubscription', {
      topicArn: failures.topicArn,
      protocol: 'https',
      endpoint: props.cloudwatchIntegrationUrl,
      rawMessageDelivery: false,
      filterPolicyScope: 'MessageBody',
      filterPolicy: { AlarmName: [{ exists: true }] }
    })

    const metrics: [string, cloudwatch.Metric][] = [
      ['eventbridge-dlq', eventbridgeDlq.metricApproximateNumberOfMessagesVisible({ statistic: 'Maximum' })],
      ['sns-dlq', snsDlq.metricApproximateNumberOfMessagesVisible({ statistic: 'Maximum' })],
      ...['FailedInvocations', 'InvocationsFailedToBeSentToDlq'].map((metricName): [string, cloudwatch.Metric] => [
        `eventbridge-${metricName}`,
        new cloudwatch.Metric({
          namespace: 'AWS/Events',
          metricName,
          statistic: 'Sum',
          dimensionsMap: { RuleName: ruleName }
        })
      ]),
      ...['NumberOfNotificationsFailed', 'NumberOfNotificationsFailedToRedriveToDlq'].map(
        (metricName): [string, cloudwatch.Metric] => [
          `sns-${metricName}`,
          topic.metric(metricName, { statistic: 'Sum' })
        ]
      )
    ]
    const alarms = metrics.map(([name, metric]) => {
      const alarm = new cloudwatch.Alarm(this, name, {
        alarmName: `aws-health-risk-${name}`,
        alarmDescription: `AWS Health RISK delivery to PagerDuty failed in ${this.region}. Check the aws-health-risk-*-dlq queues (14-day retention).`,
        metric: metric.with({ period: cdk.Duration.minutes(1) }),
        evaluationPeriods: 1,
        threshold: 0,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      })
      alarm.addAlarmAction(new actions.SnsAction(failures))
      alarm.addOkAction(new actions.SnsAction(failures))
      alarm.node.addDependency(failureSubscription)
      return alarm
    })

    const rule = new events.CfnRule(this, 'RiskRule', {
      name: ruleName,
      description: 'All AWS Health RISK events, forwarded to PagerDuty',
      state: props.enabled ? 'ENABLED' : 'DISABLED',
      eventPattern: {
        source: ['aws.health'],
        detail: {
          service: ['RISK'],
          $or: [{ backupEvent: ['false'] }, { backupEvent: [{ exists: false }] }]
        }
      },
      targets: [
        {
          id: 'health-risk-sns',
          arn: topic.topicArn,
          deadLetterConfig: { arn: eventbridgeDlq.queueArn },
          retryPolicy: { maximumEventAgeInSeconds: 86400, maximumRetryAttempts: 185 }
        }
      ]
    })
    rule.node.addDependency(topicPolicy, queuePolicy, healthSubscription, ...alarms)
  }
}
