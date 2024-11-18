#!/usr/bin/env zx
import 'zx/globals'
import { ECSClient, UpdateServiceCommand, UpdateServiceRequest, waitUntilServicesStable } from '@aws-sdk/client-ecs'

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

  const downPollResult = await waitUntilServicesStable(
    { client, maxWaitTime: 500 },
    {
      cluster: 'UntuvaCluster',
      services: ['UntuvaService']
    }
  )

  if (downPollResult.state !== 'SUCCESS') {
    throw new Error(`failed to take services down. Poll status ${downPollResult}`)
  }
  console.log('Succesfully taken down services')

  console.log('\nBring up services')
  const bringUpServicesCommand = new UpdateServiceCommand(upServicesRequest)
  const upServiceResponse = await client.send(bringUpServicesCommand)
  console.log(`desiredCount: ${upServiceResponse.service?.desiredCount}`)

  console.log('🚀 Polling for services to be brought back up...')
  const upPollResults = await waitUntilServicesStable(
    { client, maxWaitTime: 500 },
    {
      cluster: 'UntuvaCluster',
      services: ['UntuvaService']
    }
  )

  if (upPollResults.state !== 'SUCCESS') {
    throw new Error(`failed to bring services up. Poll status ${upPollResults}`)
  }
  console.log('Succesfully brought services up')
}

void main()
