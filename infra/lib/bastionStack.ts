import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { AmazonLinuxCpuType } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

interface BastionStackProps extends CommonStackProps {
  vpc: ec2.Vpc
  securityGroup: ec2.SecurityGroup
}

export class BastionStack extends cdk.Stack {
  public bastionHost: ec2.BastionHostLinux
  constructor(scope: Construct, id: string, props: BastionStackProps) {
    super(scope, id, props)

    this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc: props.vpc,
      securityGroup: props.securityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
      instanceName: `${props.envNameCapitalized}Bastion`,
      machineImage: ec2.MachineImage.latestAmazonLinux2023({ cpuType: AmazonLinuxCpuType.ARM_64 })
    })
  }
}
