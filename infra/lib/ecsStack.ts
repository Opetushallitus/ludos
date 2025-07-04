import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

export interface EcsParameters {
  vpc: ec2.Vpc
}

interface EcsStackProps extends CommonStackProps, EcsParameters {}

export class EcsStack extends cdk.Stack {
  public cluster: ecs.Cluster
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props)

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: `${props.envNameCapitalized}Cluster`
    })
  }
}
