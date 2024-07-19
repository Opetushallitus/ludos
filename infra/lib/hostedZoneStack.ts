import * as cdk from 'aws-cdk-lib'
import * as r53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

interface HostedZoneProps extends CommonStackProps {
  domain: string
}

export class HostedZoneStack extends cdk.Stack {
  public zone: r53.HostedZone

  constructor(scope: Construct, id: string, props: HostedZoneProps) {
    super(scope, id, props)
    this.zone = new r53.HostedZone(this, 'HostedZone', {
      zoneName: props.domain
    })
  }
}
