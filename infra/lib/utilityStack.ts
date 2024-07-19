import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { EnvParameters } from './envParameters'
import { EcrStack } from './ecrStack'

export class UtilityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EnvParameters) {
    super(scope, id, props)

    const { env, envName, envNameCapitalized } = props
    const commonProps = { env, envName, envNameCapitalized }

    new EcrStack(this, 'EcrStack', {
      ...commonProps
    })
  }
}
