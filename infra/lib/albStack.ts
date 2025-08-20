import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elb2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

export interface EcsParameters {
  vpc: ec2.Vpc
}

interface AlbStackProps extends CommonStackProps, EcsParameters {
  securityGroup: ec2.SecurityGroup
}

export class AlbStack extends cdk.Stack {
  public alb: elb2.ApplicationLoadBalancer
  public httpsListener: elb2.ApplicationListener
  constructor(scope: Construct, id: string, props: AlbStackProps) {
    super(scope, id, props)

    this.alb = new elb2.ApplicationLoadBalancer(this, `${props.envNameCapitalized}ApplicationLoadBalancer`, {
      vpc: props.vpc,
      securityGroup: props.securityGroup,
      loadBalancerName: `${props.envNameCapitalized}ApplicationLoadBalancer`,
      internetFacing: true
    })

    const httpListener = this.alb.addListener('HttpListeneelb2r', {
      protocol: elb2.ApplicationProtocol.HTTP
    })
    httpListener.addAction('HttpsRedirectResponse', {
      action: elb2.ListenerAction.redirect({
        host: '#{host}',
        port: '443',
        protocol: 'HTTPS',
        path: '/#{path}',
        query: '#{query}',
        permanent: true
      })
    })

    this.httpsListener = this.alb.addListener('HttpsListener', {
      protocol: elb2.ApplicationProtocol.HTTPS
    })
    this.httpsListener.addAction('DefaultResponse', { action: elb2.ListenerAction.fixedResponse(404) })
  }
}
