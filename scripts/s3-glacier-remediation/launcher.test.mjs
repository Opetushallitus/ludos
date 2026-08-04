import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const repoDir = path.resolve(currentDir, '../..')

function run(scriptName) {
  return spawnSync(path.join(currentDir, scriptName), ['discover'], {
    cwd: currentDir,
    env: {
      ...process.env,
      LUDOS_S3_GLACIER_REMEDIATION_TEST_MODE: '1'
    },
    encoding: 'utf8'
  })
}

test('direct launcher invocation fails', () => {
  const result = run('remediate-s3-glacier-backup-failures.sh')

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Don't call this script directly/)
})

test('dev launcher maps to untuva remediation environment', () => {
  const result = run('remediate-s3-glacier-backup-failures-dev.sh')

  assert.equal(result.status, 0)
  assert.match(result.stdout, /AWS_LOGIN_ENV=dev/)
  assert.match(result.stdout, /LUDOS_S3_GLACIER_REMEDIATION_ENV=untuva/)
})

test('qa launcher maps to qa remediation environment', () => {
  const result = run('remediate-s3-glacier-backup-failures-qa.sh')

  assert.equal(result.status, 0)
  assert.match(result.stdout, /AWS_LOGIN_ENV=qa/)
  assert.match(result.stdout, /LUDOS_S3_GLACIER_REMEDIATION_ENV=qa/)
})

test('prod launcher fails before execution', () => {
  const result = run('remediate-s3-glacier-backup-failures-prod.sh')

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Production S3 Glacier remediation is not enabled yet/)
})

test('script package uses the repo Node version', () => {
  const repoNodeVersion = readFileSync(path.join(repoDir, '.nvmrc'), 'utf8').trim()
  const packageJson = JSON.parse(readFileSync(path.join(currentDir, 'package.json'), 'utf8'))

  assert.equal(packageJson.engines.node, repoNodeVersion)
})
