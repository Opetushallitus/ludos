import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

interface LogGroupProps extends CommonStackProps {
  vpc: ec2.IVpc
  serviceName: string
  removalPolicy: cdk.RemovalPolicy
  /** This option defines a multiline start pattern using a regular expression. */
  logMultilinePattern?: string
  logGroupName?: string
}

export class LogGroupStack extends cdk.Stack {
  public logDriver: ecs.LogDriver
  public logGroup: logs.LogGroup
  public logGroupName: string

  constructor(scope: Construct, id: string, props: LogGroupProps) {
    super(scope, id, props)

    this.logGroupName = props.logGroupName || `/app/${props.envName}/${props.serviceName}`
    this.logGroup = new logs.LogGroup(this, id, {
      retention: logs.RetentionDays.TEN_YEARS,
      removalPolicy: props.removalPolicy,
      logGroupName: this.logGroupName
    })

    this.logDriver = ecs.LogDrivers.awsLogs({
      streamPrefix: props.serviceName,
      logGroup: this.logGroup,
      multilinePattern: props.logMultilinePattern
    })
  }
}
