#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { LudosStack } from '../lib/ludosStack'
import { getEnvParameters } from '../lib/envParameters'
import { UtilityStack } from '../lib/utilityStack'
import { EnvName, validateEnvName } from '../lib/accounts'

const app = new cdk.App()

const envName: EnvName = app.node.tryGetContext('envName')
validateEnvName(envName)

const envParameters = getEnvParameters(envName)

function getImageTagFromEnv() {
  if (process.env.IMAGE_TAG) {
    return process.env.IMAGE_TAG
  }
  throw new Error('Missing IMAGE_TAG env variable')
}

const imageTag = getImageTagFromEnv()

if (envName === 'untuva' || envName === 'hahtuva') {
  new LudosStack(app, `${envParameters.envNameCapitalized}LudosStack`, {
    ...envParameters,
    domain: `ludos.${envName}opintopolku.fi`,
    productionGrade: false,
    db: {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.SMALL),
      allocatedStorage: 20
    },
    ludosApplicationImageTag: imageTag,
    enableAccessFromGithubActions: true
  })
} else if (envName === 'qa') {
  new LudosStack(app, `QaLudosStack`, {
    ...envParameters,
    domain: `ludos.testiopintopolku.fi`,
    productionGrade: true,
    db: {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
      allocatedStorage: 50
    },
    ludosApplicationImageTag: imageTag,
    enableAccessFromGithubActions: false
  })
} else if (envName === 'prod') {
  new LudosStack(app, `ProdLudosStack`, {
    ...envParameters,
    domain: `ludos.opintopolku.fi`,
    productionGrade: true,
    db: {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
      allocatedStorage: 50
    },
    ludosApplicationImageTag: imageTag,
    enableAccessFromGithubActions: false
  })
} else if (envName === 'utility') {
  new UtilityStack(app, `UtilityStack`, envParameters)
}
