import { Client } from 'pg'

export interface ValidateInput {
  host: string
  port: number
  user: string
  password: string
  database: string
  tables: string[]
  ssl: boolean
}

export interface ValidateResult {
  passed: boolean
  perTable: Record<string, number>
  error?: string
  emptyTables?: string[]
}

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

export async function validate(input: ValidateInput): Promise<ValidateResult> {
  for (const t of input.tables) {
    if (!IDENT_RE.test(t)) {
      return { passed: false, perTable: {}, error: `invalid table name: ${t}` }
    }
  }

  const client = new Client({
    host: input.host,
    port: input.port,
    user: input.user,
    password: input.password,
    database: input.database,
    ssl: input.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000
  })

  try {
    await client.connect()
  } catch (err) {
    const code = (err as { code?: string }).code ?? (err as Error).name
    return { passed: false, perTable: {}, error: `connect failed: ${code}` }
  }

  const perTable: Record<string, number> = {}
  try {
    for (const table of input.tables) {
      try {
        const res = await client.query(`SELECT count(*)::bigint AS c FROM ${table}`)
        perTable[table] = Number(res.rows[0].c)
      } catch (err) {
        const code = (err as { code?: string }).code ?? (err as Error).name
        return { passed: false, perTable, error: `query failed on ${table}: ${code}` }
      }
    }
  } finally {
    await client.end().catch(() => undefined)
  }

  const emptyTables = Object.entries(perTable)
    .filter(([, c]) => c === 0)
    .map(([t]) => t)

  if (emptyTables.length > 0) {
    return { passed: false, perTable, emptyTables, error: `empty: ${emptyTables.join(',')}` }
  }
  return { passed: true, perTable }
}
