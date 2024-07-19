import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { CommonStackProps, NumberOfAvailabilityZones } from '../types'

export interface VpcParameters {
  cidrBlock: string
  numberOfAvailabilityZones: NumberOfAvailabilityZones
}

interface VpcStackProps extends CommonStackProps, VpcParameters {}

export class VpcStack extends cdk.Stack {
  public vpc: ec2.Vpc
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props)

    this.vpc = new ec2.Vpc(this, `${props.envNameCapitalized}Vpc`, {
      ipAddresses: ec2.IpAddresses.cidr(props.cidrBlock),
      maxAzs: props.numberOfAvailabilityZones
    })
  }
}
