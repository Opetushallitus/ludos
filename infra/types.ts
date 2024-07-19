import { Environment, StackProps } from 'aws-cdk-lib'
import { EnvName } from './lib/accounts'

export type NumberOfAvailabilityZones = 2 | 3

export interface CommonStackProps extends StackProps {
  env: Environment
  envName: EnvName
  envNameCapitalized: string
}
