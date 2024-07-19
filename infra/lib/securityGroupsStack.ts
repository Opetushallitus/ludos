import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

interface SecurityGroupsStackProps extends CommonStackProps {
  vpc: ec2.Vpc
}

export class SecurityGroupsStack extends cdk.Stack {
  public albSecurityGroup: ec2.SecurityGroup
  public dbSecurityGroup: ec2.SecurityGroup
  public bastionSecurityGroup: ec2.SecurityGroup
  public serviceSecurityGroup: ec2.SecurityGroup

  constructor(scope: Construct, id: string, props: SecurityGroupsStackProps) {
    super(scope, id, props)

    this.albSecurityGroup = new ec2.SecurityGroup(this, `AlbSecurityGroup`, { vpc: props.vpc })
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, `BastionSecurityGroup`, { vpc: props.vpc })
    this.serviceSecurityGroup = new ec2.SecurityGroup(this, `ServiceSecurityGroup`, { vpc: props.vpc })
  }

  // SecurityGroupsStack cannot own dbSecurityGroup because of a cyclic dependency with SecretRotation https://github.com/aws/aws-cdk/issues/18026
  setDbSecurityGroup(dbSecurityGroup: ec2.SecurityGroup) {
    this.dbSecurityGroup = dbSecurityGroup
  }

  createRules() {
    // This deferred rule creation is needed for the same reason as setDbSecurityGroup exists
    this.dbSecurityGroup.addIngressRule(this.bastionSecurityGroup, ec2.Port.tcp(5432))
    this.dbSecurityGroup.addIngressRule(this.serviceSecurityGroup, ec2.Port.tcp(5432))
  }
}
