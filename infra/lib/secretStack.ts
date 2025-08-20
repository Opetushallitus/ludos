import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Role } from 'aws-cdk-lib/aws-iam'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

export class SecretStack extends cdk.Stack {
  readonly pagerdutySecret

  constructor(scope: Construct, id: string, props: CommonStackProps, githubActionsRole: Role) {
    super(scope, id, props)

    this.pagerdutySecret = new Secret(this, 'pagerduty-secret', {
      secretName: '/pagerduty/event_url',
      description: '',
      removalPolicy: RemovalPolicy.RETAIN
    })

    this.pagerdutySecret.grantRead(githubActionsRole)
  }
}
