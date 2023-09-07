import { command, positional, run, subcommands, Type, union } from 'cmd-ts'
import chalk, { ChalkInstance } from 'chalk'
import fs, { promises as fsPromises } from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import * as XLSX from 'xlsx'

XLSX.set_fs(fs)

const CALLER_ID = 'ludos-localizations'

const Environment = {
  untuva: 'untuva',
  qa: 'qa'
} as const
type Environment = (typeof Environment)[keyof typeof Environment]

function isEnvironment(obj: any): obj is Environment {
  return typeof obj === 'string' && obj in Environment
}

interface XlsxInput {
  workbook: XLSX.WorkBook
  filepath: string
}

interface XlsxOutput {
  filepath: string
}

const Locale = {
  fi: 'fi',
  sv: 'sv'
} as const
type Locale = (typeof Locale)[keyof typeof Locale]
const Locales: Locale[] = Object.keys(Locale) as Locale[]

function theOtherLocale(locale: Locale): Locale {
  return locale === Locale.fi ? Locale.sv : Locale.fi
}

interface Credentials {
  username: string
  password: string
}

function environmentBaseUrl(env: Environment) {
  switch (env) {
    case Environment.untuva:
      return 'https://virkailija.untuvaopintopolku.fi'
    case Environment.qa:
      return 'https://virkailija.testiopintopolku.fi'
  }
}

function localizationApiBaseUrlByEnv(env: Environment) {
  return `${environmentBaseUrl(env)}/lokalisointi/cxf/rest/v1`
}

async function credentialsForEnv(env: Environment): Promise<Credentials> {
  const credentialFilePath = path.join(homedir(), '.oph-credentials.json')
  try {
    const data = JSON.parse(await fsPromises.readFile(credentialFilePath, 'utf-8'))
    return data[env]
  } catch (err) {
    console.error(`Unable to read credentials from ${credentialFilePath}`)
    throw err
  }
}

async function loginToLokalisointi(env: Environment) {
  const credentials = await credentialsForEnv(env)
  const tgtResponse = await fetch(`${environmentBaseUrl(env)}/cas/v1/tickets`, {
    method: 'POST',
    body: `username=${credentials.username}&password=${credentials.password}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  const tgtTicket = tgtResponse.headers.get('location')?.split('/').pop()
  if (tgtTicket === null) {
    throw new Error(`Unable to login: could not get TGT ticket, response status was ${tgtResponse.status}`)
  }

  const stResponse = await fetch(`${environmentBaseUrl(env)}/cas/v1/tickets/${tgtTicket}`, {
    method: 'POST',
    body: new URLSearchParams({
      service: `${environmentBaseUrl(env)}/lokalisointi/j_spring_cas_security_check`
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'caller-id': CALLER_ID,
      CSRF: 'CSRF',
      Cookie: 'CSRF=CSRF'
    }
  })

  if (stResponse.status !== 200) {
    throw new Error(`Unable to login: unexpected status getting ST ticket: ${stResponse.status}`)
  }

  const stTicket = await stResponse.text()

  const loginResponse = await fetch(
    `${localizationApiBaseUrlByEnv(env)}/localisation?category=fakeforlogin&ticket=${stTicket}`
  )
  const cookiesString = loginResponse.headers.get('set-cookie')
  if (cookiesString === null) {
    throw new Error(`Unable to login: could not get cookies from login response`)
  }

  function extractCookieValue(name: string, cookieStr: string): string {
    const match = cookieStr.match(new RegExp(`${name}=([^;]+)`))
    if (!match || match.length < 2) {
      throw new Error(`Could not extract ${name} from ${cookieStr}`)
    }
    return match[1]
  }

  return {
    CSRF: extractCookieValue('CSRF', cookiesString),
    JSESSIONID: extractCookieValue('JSESSIONID', cookiesString)
  }
}

interface LocalizationIn {
  key: string
  locale: Locale
  value: string
  modified?: number
}

interface LocalizationOut {
  category: string
  key: string
  locale: Locale
  value: string
}

class Localizations {
  localizationsByKeyAndLocale: Map<string, Map<Locale, LocalizationIn>>
  public sourceName: string

  constructor(localizations: LocalizationIn[], sourceName: string) {
    this.sourceName = sourceName
    this.localizationsByKeyAndLocale = localizations.reduce((acc, l) => {
      if (!acc.has(l.key)) {
        acc.set(l.key, new Map())
      }
      acc.get(l.key)!.set(l.locale, l)
      return acc
    }, new Map<string, Map<Locale, LocalizationIn>>())
  }

  contains(key: string): boolean
  contains(key: string, locale: Locale): boolean

  contains(key: string, locale?: Locale): boolean {
    if (locale) {
      return this.localizationsByKeyAndLocale.has(key) && this.localizationsByKeyAndLocale.get(key)!.has(locale)
    } else {
      return this.localizationsByKeyAndLocale.has(key)
    }
  }

  keys() {
    return [...this.localizationsByKeyAndLocale.keys()].sort()
  }

  get(key: string): Map<string, LocalizationIn> | undefined
  get(key: string, locale: Locale): LocalizationIn | undefined

  get(key: string, locale?: Locale): LocalizationIn | Map<string, LocalizationIn> | undefined {
    if (locale) {
      return this.localizationsByKeyAndLocale.get(key)?.get(locale)
    } else {
      return this.localizationsByKeyAndLocale.get(key)
    }
  }

  private countLocale(locale: Locale): number {
    return [...this.localizationsByKeyAndLocale.values()].flatMap((m) =>
      [...m.values()].filter((l) => l.locale === locale)
    ).length
  }

  stats() {
    return {
      avaimia: this.keys().length,
      fi: this.countLocale(Locale.fi),
      sv: this.countLocale(Locale.sv)
    }
  }

  set(key: string, locale: Locale, localization: LocalizationIn) {
    return this.localizationsByKeyAndLocale.get(key)?.set(locale, localization)
  }

  localizationServicePayload(): LocalizationOut[] {
    return [...this.localizationsByKeyAndLocale.entries()].flatMap(([key, locales]) =>
      [...locales.entries()].map(([_, localization]) => ({
        category: 'ludos',
        key,
        locale: localization.locale,
        value: localization.value
      }))
    )
  }

  xlsx(): XLSX.WorkBook {
    const wsData: (string | number)[][] = [['Key', 'fi', 'sv']]
    this.keys().forEach((key) =>
      wsData.push([key, this.get(key, Locale.fi)?.value || '', this.get(key, Locale.sv)?.value || ''])
    )
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SheetJS')
    return wb
  }
}

async function fetchLocalizationsFromEnv(env: Environment): Promise<Localizations> {
  const endpointUrl = `${localizationApiBaseUrlByEnv(env)}/localisation?value=NOCACHE&category=ludos`
  const response = await fetch(endpointUrl)
  if (response.status === 200) {
    const localizations: LocalizationIn[] = await response.json()
    return new Localizations(localizations, env)
  } else {
    throw new Error(`Error fetching localizations from ${env}}, response status ${response.status}`)
  }
}

function formatDate(timestamp: number | undefined): string {
  if (timestamp === undefined) {
    return ''
  } else {
    return ` (${new Date(timestamp).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Helsinki'
    })})`
  }
}

async function fetchLocalizationsFromXlsxInput(from: XlsxInput): Promise<Localizations> {
  const worksheet = from.workbook.Sheets[from.workbook.SheetNames[0]]
  let data: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1) as string[][]
  let locs: LocalizationIn[] = data.flatMap((row) => [
    { key: row[0], locale: Locale.fi, value: row[1] },
    { key: row[0], locale: Locale.sv, value: row[2] }
  ])

  return new Localizations(locs, from.filepath)
}

async function fetchLocalizations(from: Environment | XlsxInput): Promise<Localizations> {
  if (isEnvironment(from)) {
    return fetchLocalizationsFromEnv(from)
  } else {
    return fetchLocalizationsFromXlsxInput(from)
  }
}

async function list(from: Environment | XlsxInput) {
  const localizations = await fetchLocalizations(from)

  localizations.keys().forEach((key) => {
    console.log(`${key}:`)
    const locales = [...localizations.localizationsByKeyAndLocale.get(key)!.keys()].sort()

    locales.forEach((locale) => {
      const localization = localizations.localizationsByKeyAndLocale.get(key)!.get(locale)!
      console.log(`  ${locale}: "${localization.value}"${formatDate(localization.modified)}`)
    })
  })
  console.log(`\nStats: ${JSON.stringify(localizations.stats(), null, 2)}`)
}

function sourceName(envOrXlsx: Environment | XlsxInput) {
  return isEnvironment(envOrXlsx) ? envOrXlsx : envOrXlsx.filepath
}
function sinkName(envOrXlsx: Environment | XlsxOutput) {
  return isEnvironment(envOrXlsx) ? envOrXlsx : envOrXlsx.filepath
}

async function diff(
  from: Environment | XlsxInput,
  to: Environment | XlsxInput,
  print: boolean
): Promise<LocalizationIn[]> {
  function formatLoc(localization: LocalizationIn, colorer: ChalkInstance) {
    return `${colorer(`"${localization.value}"`)}${formatDate(localization.modified)}`
  }
  const fromLocs = await fetchLocalizations(from)
  const toLocs = await fetchLocalizations(to)

  const allKeys = [...new Set([...fromLocs.keys(), ...toLocs.keys()])].sort()

  const newAndChangedLocalizations: LocalizationIn[] = []
  function addNewOrChangedLocalizationAndEnsureBothLocales(l: LocalizationIn): LocalizationIn[] {
    newAndChangedLocalizations.push(l)
    if (!toLocs.contains(l.key, theOtherLocale(l.locale))) {
      const emptyLocalization = {
        key: l.key,
        locale: theOtherLocale(l.locale),
        value: ''
      }
      newAndChangedLocalizations.push(emptyLocalization)
      return [emptyLocalization]
    } else {
      return []
    }
  }

  const stats = {
    onlyInFrom: 0,
    onlyInTo: 0,
    valueChanged: 0,
    emptyLocalizationsThatWouldBeAdded: 0
  }

  allKeys.forEach((key) => {
    const localeRows: string[] = []
    Locales.forEach((locale) => {
      const prefix = `  ${locale}:`
      const fromLoc = fromLocs.get(key, locale)
      const toLoc = toLocs.get(key, locale)

      function addEmptyLocalizationIfNecessary(localization: LocalizationIn) {
        const addedEmptyLocalizations = addNewOrChangedLocalizationAndEnsureBothLocales(localization)
        stats.emptyLocalizationsThatWouldBeAdded += addedEmptyLocalizations.length
        addedEmptyLocalizations.forEach((l) => {
          localeRows.push(`  ${l.locale}: ${formatLoc(l, chalk.green)} (adding empty localization for convenience)`)
        })
      }

      if (fromLoc && toLoc) {
        if (fromLoc.value !== toLoc.value) {
          localeRows.push(
            `${prefix} ${sourceName(from)}=${formatLoc(fromLoc, chalk.green)} => ${sourceName(to)}=${formatLoc(
              toLoc,
              chalk.red
            )}`
          )
          stats.valueChanged++
          addEmptyLocalizationIfNecessary(fromLoc)
        }
      } else if (fromLoc) {
        localeRows.push(`${prefix} ${formatLoc(fromLoc, chalk.green)} (only in ${sourceName(from)})`)
        stats.onlyInFrom++
        addEmptyLocalizationIfNecessary(fromLoc)
      } else if (toLoc) {
        stats.onlyInTo++
        localeRows.push(`${prefix} ${formatLoc(toLoc, chalk.red)} (only in ${sourceName(to)})`)
      }
    })

    if (print) {
      if (fromLocs.contains(key) && !toLocs.contains(key)) {
        console.log(`${chalk.green(key)}: (only in ${sourceName(from)})`)
      } else if (!fromLocs.contains(key) && toLocs.contains(key)) {
        console.log(`${chalk.red(key)}: (only in ${sourceName(to)})`)
      } else if (localeRows.length > 0) {
        console.log(`${key}:`)
      }
      if (localeRows.length > 0) {
        console.log(localeRows.join('\n'))
      }
    }
  })
  if (print) {
    console.log(`\nstats: ${JSON.stringify(stats, null, 2)}`)
  }
  return newAndChangedLocalizations
}

async function getNewAndChangedLocalizations(
  from: Environment | XlsxInput,
  to: Environment | XlsxOutput
): Promise<Localizations> {
  if (isEnvironment(to)) {
    return new Localizations(await diff(from, to, false), `${sourceName(from)}->${sinkName(to)}`)
  } else {
    return await fetchLocalizations(from)
  }
}

async function writeLocalizationsToEnv(localizations: Localizations, to: Environment) {
  const sessionCookies = await loginToLokalisointi(to)
  const cookieString = Object.entries(sessionCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
  const updateResponse = await fetch(`${localizationApiBaseUrlByEnv(to)}/localisation/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'caller-id': CALLER_ID,
      Cookie: cookieString,
      CSRF: sessionCookies.CSRF
    },
    body: JSON.stringify(localizations.localizationServicePayload())
  })
  if (updateResponse.status !== 200) {
    throw new Error(`Error updating ${to}, status=${updateResponse.status}, response='${await updateResponse.text()}'`)
  }

  console.log(`${to} updated`)
  console.log(await updateResponse.text())
}
async function copy(from: Environment | XlsxInput, to: Environment | XlsxOutput) {
  const newAndChangedLocalizations = await getNewAndChangedLocalizations(from, to)
  if (isEnvironment(to)) {
    await writeLocalizationsToEnv(newAndChangedLocalizations, to)
  } else {
    const workbook = newAndChangedLocalizations.xlsx()
    XLSX.writeFile(workbook, to.filepath)
  }
}

const EnvironmentParameter: Type<string, Environment> = {
  async from(str) {
    if (isEnvironment(str)) {
      return Environment[str as Environment]
    } else {
      throw new Error(`Unknown environment ${str}`)
    }
  },
  description: `${Object.values(Environment).join('|')}`
}

const XlsxInputParameter: Type<string, XlsxInput> = {
  async from(path: string) {
    return {
      workbook: XLSX.readFile(path),
      filepath: path
    }
  },
  description: `${EnvironmentParameter.description} OR path to an existing .xlsx file`
}

const XlsxOutputParameter: Type<string, XlsxOutput> = {
  async from(path: string) {
    if (!path.toLowerCase().endsWith('.xlsx')) {
      throw new Error(`Path '${path}' does not end with .xlsx}`)
    }
    return {
      filepath: path
    }
  },
  description: `${EnvironmentParameter.description} OR Path to the .xlsx file to write`
}

const envOrXlsxInputType = union([EnvironmentParameter, XlsxInputParameter])
const envOrXlsxOutputType = union([EnvironmentParameter, XlsxOutputParameter])

const listCommand = command({
  name: 'list',
  description: 'Lists keys in an environment',
  args: {
    env: positional({ type: envOrXlsxInputType, displayName: 'environment' })
  },
  handler: async (args) => {
    await list(args.env)
  }
})

const diffCommand = command({
  name: 'diff',
  description: 'Diffs keys between two environments',
  args: {
    from: positional({ type: envOrXlsxInputType, displayName: 'from' }),
    to: positional({ type: envOrXlsxInputType, displayName: 'to' })
  },
  handler: async (args) => {
    await diff(args.from, args.to, true)
  }
})

const copyCommand = command({
  name: 'copy',
  description: `Copy new and changed localizations from one env/file to another.
  
                See main --help for help setting up env credentials.`.replace(/  +/g, ''),
  args: {
    from: positional({ type: envOrXlsxInputType, displayName: 'from' }),
    to: positional({ type: envOrXlsxOutputType, displayName: 'to' })
  },
  handler: async (args) => {
    await copy(args.from, args.to)
  }
})

const app = subcommands({
  name: 'localizations',
  description: `Manage LUDOS localizations.
  
     Write operations to an environment require your virkailija credentials
     in ~/.oph-credentials.json format:
     {"qa": {"username": "foo", "password: "bar"}}`.replace(/  +/g, ''),
  version: '1.0.0',
  cmds: {
    list: listCommand,
    diff: diffCommand,
    copy: copyCommand
  }
})

run(app, process.argv.slice(2))
