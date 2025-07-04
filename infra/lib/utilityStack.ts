import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { EcrStack } from './ecrStack'
import { EnvParameters } from './envParameters'

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
