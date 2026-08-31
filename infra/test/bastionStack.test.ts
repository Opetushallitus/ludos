import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { BastionStack } from '../lib/bastionStack'

function synthesizeBastionStack(envName: 'untuva' | 'qa') {
  const app = new cdk.App()
  const env = {
    account: envName === 'untuva' ? '782034763554' : '260185049060',
    region: 'eu-west-1'
  }
  const networkStack = new cdk.Stack(app, 'NetworkStack', { env })
  const vpc = new ec2.Vpc(networkStack, 'Vpc', { maxAzs: 1, natGateways: 0 })
  const securityGroup = new ec2.SecurityGroup(networkStack, 'SecurityGroup', { vpc })

  return Template.fromStack(
    new BastionStack(app, 'BastionStack', {
      env,
      envName,
      envNameCapitalized: envName === 'untuva' ? 'Untuva' : 'Qa',
      vpc,
      securityGroup
    })
  ).toJSON() as {
    Parameters: Record<string, { Default?: string }>
    Resources: Record<string, { Type: string; Properties?: { UserData?: { 'Fn::Base64': string } } }>
  }
}

function findImageParameter(template: ReturnType<typeof synthesizeBastionStack>) {
  return Object.values(template.Parameters).find((parameter) => parameter.Default?.includes('al2023-ami-kernel'))
}

function findInstance(template: ReturnType<typeof synthesizeBastionStack>) {
  return Object.entries(template.Resources).find(([, resource]) => resource.Type === 'AWS::EC2::Instance')
}

test('bastion uses the current default AL2023 ARM64 AMI and replaces on image revision changes in dev', () => {
  const template = synthesizeBastionStack('untuva')
  const imageParameter = findImageParameter(template)
  const instance = findInstance(template)

  assert.equal(imageParameter?.Default, '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64')
  if (!instance) {
    throw new Error('Expected a bastion EC2 instance in the synthesized template')
  }
  assert.match(instance[1].Properties?.UserData?.['Fn::Base64'] ?? '', /bastion-image-revision: 2026-08-31/)
  assert.match(instance[0], /[A-Fa-f0-9]{16}$/)
})

test('bastion keeps the existing image and replacement behavior outside dev', () => {
  const template = synthesizeBastionStack('qa')
  const imageParameter = findImageParameter(template)
  const instance = findInstance(template)

  assert.equal(imageParameter?.Default, '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-arm64')
  if (!instance) {
    throw new Error('Expected a bastion EC2 instance in the synthesized template')
  }
  assert.doesNotMatch(instance[1].Properties?.UserData?.['Fn::Base64'] ?? '', /bastion-image-revision/)
  assert.doesNotMatch(instance[0], /[A-Fa-f0-9]{16}$/)
})
