#!/usr/bin/env zx
import 'zx/globals'
import { ECSClient, UpdateServiceCommand, UpdateServiceRequest } from '@aws-sdk/client-ecs'

const client = new ECSClient({ region: 'eu-west-1' })

const takeDownServicesRequest: UpdateServiceRequest = {
  cluster: 'UntuvaCluster',
  service: 'UntuvaService',
  desiredCount: 0
}
const upServicesRequest: UpdateServiceRequest = {
  cluster: 'UntuvaCluster',
  service: 'UntuvaService',
  desiredCount: 2
}

async function main() {
  console.log('Take down services')
  const takeDownServicesCommand = new UpdateServiceCommand(takeDownServicesRequest)
  const downServiceResponse = await client.send(takeDownServicesCommand)
  console.log(`desiredCount: ${downServiceResponse.service?.desiredCount}`)
  console.log('🧨 Polling for services to be taken down...')
  const stableCommandDown = await $`aws ecs wait services-stable --cluster UntuvaCluster --service UntuvaService`

  if (stableCommandDown.exitCode !== 0) {
    throw new Error('failed to take down service')
  }
  console.log('Succesfully taken down services')

  console.log('\nBring up services')
  const bringUpServicesCommand = new UpdateServiceCommand(upServicesRequest)
  const upServiceResponse = await client.send(bringUpServicesCommand)
  console.log(`desiredCount: ${upServiceResponse.service?.desiredCount}`)

  console.log('🚀 Polling for services to be brought back up...')
  const stableCommandUp = await $`aws ecs wait services-stable --cluster UntuvaCluster --service UntuvaService`

  if (stableCommandUp.exitCode !== 0) {
    throw new Error('failed to bring services up')
  }
  console.log('Succesfully brought services up')
}

void main()
