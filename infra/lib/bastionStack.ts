import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { AmazonLinuxCpuType } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

// Bump this when the bastion image must be explicitly replaced by CloudFormation.
const bastionImageRevision = '2026-08-31'

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
      machineImage: new ec2.AmazonLinux2023ImageSsmParameter({
        cpuType: AmazonLinuxCpuType.ARM_64,
        kernel: ec2.AmazonLinux2023Kernel.DEFAULT,
        cachedInContext: false
      }),
      userDataCausesReplacement: true
    })

    this.bastionHost.instance.addUserData(`# bastion-image-revision: ${bastionImageRevision}`)
  }
}
