import { Environment } from 'aws-cdk-lib'
import { NumberOfAvailabilityZones } from '../types'
import { capitalize } from '../utils'
import * as accounts from './accounts'
import { EnvName } from './accounts'
import { VpcParameters } from './vpcStack'

export interface EnvParameters {
  env: Environment
  envName: EnvName
  envNameCapitalized: string
  vpcParameters: VpcParameters
}

const defaultRegion = 'eu-west-1'

const cidrBlocksByEnvName: { [k in EnvName]: string } = {
  utility: '10.30.0.0/16',
  untuva: '10.31.0.0/16',
  hahtuva: '10.32.0.0/16',
  qa: '10.33.0.0/16',
  prod: '10.34.0.0/16'
}

const numberOfAvailabilityZonesByEnvName: { [k in EnvName]: NumberOfAvailabilityZones } = {
  utility: 2,
  untuva: 2,
  hahtuva: 2,
  qa: 3,
  prod: 3
}

export function getEnvParameters(envName: EnvName): EnvParameters {
  return {
    env: {
      account: accounts.getAccountByEnvName(envName).id,
      region: defaultRegion
    },
    envName,
    envNameCapitalized: capitalize(envName),
    vpcParameters: {
      cidrBlock: cidrBlocksByEnvName[envName],
      numberOfAvailabilityZones: numberOfAvailabilityZonesByEnvName[envName]
    }
  }
}
