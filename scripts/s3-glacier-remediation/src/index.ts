import { parseRemediationEnv, runCommand } from './remediation.js'

async function main() {
  const env = parseRemediationEnv(process.env)
  const command = process.argv[2]
  if (!command) {
    throw new Error("Missing command. Expected one of: discover, copy, verify, remediate")
  }

  await runCommand(env, command)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
