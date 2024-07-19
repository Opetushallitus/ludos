import { CommonStackProps } from '../types'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'

export class AlarmStack extends cdk.Stack {
  readonly alarmSnsTopic

  constructor(scope: Construct, id: string, props: CommonStackProps) {
    super(scope, id, props)

    this.alarmSnsTopic = new sns.Topic(this, 'AlarmSnsTopic')

    const slackWebhookUrlSecretName = `/${props.envNameCapitalized}LudosStack/LudosApplicationStack/SlackWebhookUrl`

    const slackNotifierLambda = new lambda.Function(this, 'SlackNotifierLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambdas/slackNotifierLambda')),
      environment: {
        SLACK_WEBHOOK_URL_SECRET_NAME: slackWebhookUrlSecretName
      }
    })
    this.alarmSnsTopic.addSubscription(new subscriptions.LambdaSubscription(slackNotifierLambda))
    secretsmanager.Secret.fromSecretNameV2(this, 'SlackWebhookUrlSecret', slackWebhookUrlSecretName).grantRead(
      slackNotifierLambda
    )
  }
}
