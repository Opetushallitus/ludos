#!/usr/bin/env zx
import 'zx/globals'
import {
  ECSClient,
  UpdateServiceCommand,
  UpdateServiceRequest,
  waitUntilServicesStable,
  ListTasksCommand,
  DescribeTasksCommand
} from '@aws-sdk/client-ecs'
import { setTimeout } from 'timers/promises'

const client = new ECSClient({ region: 'eu-west-1' })
const cluster = 'UntuvaCluster'
const service = 'UntuvaService'

const takeDownServicesRequest: UpdateServiceRequest = {
  desiredCount: 0,
  cluster,
  service
}
const upServicesRequest: UpdateServiceRequest = {
  cluster,
  service,
  desiredCount: 2
}

async function main() {
  await takeServiceDown()
  await bringServiceUp()
}

async function takeServiceDown() {
  console.log('Take down services')
  const takeDownServicesCommand = new UpdateServiceCommand(takeDownServicesRequest)
  const downServiceResponse = await client.send(takeDownServicesCommand)
  console.log(`desiredCount: ${downServiceResponse.service?.desiredCount}`)
  console.log('🧨 Polling for services to be taken down...')
  const allStopped = await pollForStoppedTasks()
  if (!allStopped) {
    throw new Error('Tasks not stopped in given time')
  }
  console.log('Successfully taken down services')
}

async function bringServiceUp() {
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
  console.log('Successfully brought services up')
}

async function pollForStoppedTasks() {
  await poll(noDesiredStatusRunningTasks)

  const listStoppedCommand = new ListTasksCommand({
    cluster,
    serviceName: service,
    desiredStatus: 'STOPPED'
  })

  const { taskArns } = await client.send(listStoppedCommand)
  if (!taskArns || taskArns.length === 0) {
    throw new Error('No tasks with desired status "STOPPED"')
  }
  const allStopped = await poll(() => allTasksStopped(taskArns))
  console.log({ allStopped })
  return allStopped
}

async function noDesiredStatusRunningTasks() {
  const listRunningCommand = new ListTasksCommand({
    cluster,
    serviceName: service,
    desiredStatus: 'RUNNING'
  })

  const { taskArns } = await client.send(listRunningCommand)
  return taskArns?.length === 0
}

async function allTasksStopped(taskArns: string[]) {
  const describeCommand = new DescribeTasksCommand({
    cluster,
    tasks: taskArns
  })

  console.log(`Fetching describe for tasks: ${taskArns.join(', ')}`)
  const { tasks } = await client.send(describeCommand)
  console.log(`Fetch success, Checking that all task are stopped`)
  // console.log(statuses)
  if (!tasks) {
    throw new Error('Didnt find tasks for task Arns')
  }
  return tasks.every((task) => task.lastStatus === 'STOPPED')
}

async function poll(func: () => Promise<boolean>, retriesLeft = 40): Promise<boolean> {
  if (retriesLeft === 0) {
    throw new Error('Failed to get succesfull status in 20 tries')
  }
  const success = await func()
  if (!success) {
    console.log(`polling again in 15 second, retries left: ${retriesLeft}`)
    await setTimeout(15000)
    return await poll(func, retriesLeft - 1)
  }
  return success
}

void main()
