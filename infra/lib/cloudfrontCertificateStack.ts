import * as cdk from 'aws-cdk-lib'
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'

interface CloudFrontCertificateStackProps extends CommonStackProps {
  hostedZone: route53.HostedZone
  domain: string
}

// CloudFront needs its certs to reside in us-east-1, so we need a separate stack for it
export class CloudFrontCertificateStack extends cdk.Stack {
  public certificate: certificateManager.Certificate
  constructor(scope: Construct, id: string, props: CloudFrontCertificateStackProps) {
    super(scope, id, props)

    this.certificate = new certificateManager.Certificate(this, 'Certificate', {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: certificateManager.CertificateValidation.fromDns(props.hostedZone)
    })
  }
}
