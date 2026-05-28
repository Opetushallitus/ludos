import { describeInstance, getDbCredentials, reportValidationResult } from './awsClients'
import { validate } from './validator'

interface RestoreJobEventDetail {
  restoreJobId: string
  status: string
  resourceType: string
  createdResourceArn?: string
  restoreTestingPlanArn?: string
}

interface RestoreJobEvent {
  detail: RestoreJobEventDetail
}

const POLL_INTERVAL_MS = 10_000
const POLL_MAX_ATTEMPTS = 30

export const DATABASE_NAME = 'ludos'
export const VALIDATION_TABLES = ['assignment', 'instruction', 'certificate']

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dbInstanceIdFromArn(arn: string): string {
  const last = arn.split(':').pop()
  if (!last) {
    throw new Error(`unparseable createdResourceArn: ${arn}`)
  }
  return last
}

async function waitForAvailable(dbInstanceId: string): Promise<{ host: string; port: number }> {
  for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
    const desc = await describeInstance(dbInstanceId)
    if (!desc) {
      throw new Error(`instance not found: ${dbInstanceId}`)
    }
    if (desc.status === 'available' && desc.host && desc.port) {
      return { host: desc.host, port: desc.port }
    }
    if (attempt < POLL_MAX_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS)
    }
  }
  const seconds = (POLL_INTERVAL_MS * POLL_MAX_ATTEMPTS) / 1000
  throw new Error(`timeout waiting for DBInstanceStatus=available after ${seconds}s`)
}

export const handler = async (event: RestoreJobEvent): Promise<void> => {
  const { restoreJobId, createdResourceArn, status, resourceType } = event.detail
  console.log('received event', { restoreJobId, status, resourceType, createdResourceArn })

  if (!restoreJobId) {
    console.error('event missing restoreJobId; cannot report result')
    return
  }

  try {
    if (status !== 'COMPLETED') {
      throw new Error(`unexpected status: ${status}`)
    }
    if (resourceType !== 'RDS') {
      throw new Error(`unexpected resourceType: ${resourceType}`)
    }
    if (!createdResourceArn) {
      throw new Error('missing createdResourceArn')
    }

    const secretId = process.env.DB_SECRET_ARN
    if (!secretId) {
      throw new Error('DB_SECRET_ARN env var not set')
    }

    const dbInstanceId = dbInstanceIdFromArn(createdResourceArn)
    const { host, port } = await waitForAvailable(dbInstanceId)
    const { username, password } = await getDbCredentials(secretId)

    const result = await validate({
      host,
      port,
      user: username,
      password,
      database: DATABASE_NAME,
      tables: VALIDATION_TABLES,
      ssl: true
    })

    console.log('validate result', result)
    if (result.passed) {
      await reportValidationResult(restoreJobId, 'SUCCESSFUL', `counts: ${JSON.stringify(result.perTable)}`)
    } else {
      await reportValidationResult(restoreJobId, 'FAILED', result.error ?? 'validation failed')
    }
  } catch (err) {
    const name = (err as Error).name || 'Error'
    const message = (err as Error).message || String(err)
    console.error('handler error', name, message)
    await reportValidationResult(restoreJobId, 'FAILED', `unhandled: ${name}: ${message}`).catch((reportErr) =>
      console.error('failed to report result', reportErr)
    )
  }
}
