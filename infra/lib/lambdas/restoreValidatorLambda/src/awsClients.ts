import { BackupClient, PutRestoreValidationResultCommand } from '@aws-sdk/client-backup'
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

export interface DbEndpoint {
  status: string
  host?: string
  port?: number
}

const rds = new RDSClient({})
const secrets = new SecretsManagerClient({})
const backup = new BackupClient({})

export async function describeInstance(dbInstanceIdentifier: string): Promise<DbEndpoint | null> {
  const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier }))
  const instance = res.DBInstances?.[0]
  if (!instance) {
    return null
  }
  return {
    status: instance.DBInstanceStatus ?? 'unknown',
    host: instance.Endpoint?.Address,
    port: instance.Endpoint?.Port
  }
}

export async function getDbCredentials(secretId: string): Promise<{ username: string; password: string }> {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }))
  if (!res.SecretString) {
    throw new Error('secret has no SecretString')
  }
  const parsed = JSON.parse(res.SecretString) as { username?: string; password?: string }
  if (!parsed.username || !parsed.password) {
    throw new Error('secret missing username/password')
  }
  return { username: parsed.username, password: parsed.password }
}

export async function reportValidationResult(
  restoreJobId: string,
  status: 'SUCCESSFUL' | 'FAILED',
  message: string
): Promise<void> {
  await backup.send(
    new PutRestoreValidationResultCommand({
      RestoreJobId: restoreJobId,
      ValidationStatus: status,
      ValidationStatusMessage: message.slice(0, 1024)
    })
  )
}
