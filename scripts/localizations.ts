import fs, { promises as fsPromises } from 'fs'
import * as path from 'path'
import { homedir } from 'os'

import ts from 'typescript'
import { boolean, command, flag, option, optional, positional, run, string, subcommands, Type, union } from 'cmd-ts'
import chalk, { ChalkInstance } from 'chalk'
import * as XLSX from 'xlsx'
import * as process from 'process'

XLSX.set_fs(fs)

const CALLER_ID = 'ludos-localizations'
const WEB_SRC_DIR_PATH = '../web/src'
const LOKALISAATIOPALVELU_SESSION_CACHE_FILE = path.join(process.env['HOME']!, '.lokalisaatiopalvelu_session')

const Environment = {
  untuva: 'untuva',
  qa: 'qa',
  prod: 'prod'
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
    case Environment.prod:
      return 'https://virkailija.opintopolku.fi'
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

interface SessionCookies {
  JSESSIONID: string
}

async function readSessionCacheFile(): Promise<Map<Environment, SessionCookies> | undefined> {
  try {
    const cacheObject = JSON.parse(await fsPromises.readFile(LOKALISAATIOPALVELU_SESSION_CACHE_FILE, 'utf-8'))
    return new Map<Environment, SessionCookies>(Object.entries(cacheObject) as any)
  } catch (e) {
    if (fs.existsSync(LOKALISAATIOPALVELU_SESSION_CACHE_FILE)) {
      console.log(`Error reading existing session cache file ${LOKALISAATIOPALVELU_SESSION_CACHE_FILE}, deleting it`, e)
      fs.unlinkSync(LOKALISAATIOPALVELU_SESSION_CACHE_FILE)
    }
    return undefined
  }
}

async function addSessionToSessionCacheFile(env: Environment, sessionCookies: SessionCookies) {
  const updatedSessionCache: Map<Environment, SessionCookies> =
    (await readSessionCacheFile())?.set(env, sessionCookies) ??
    new Map<Environment, SessionCookies>([[env, sessionCookies]])
  try {
    await fsPromises.writeFile(
      LOKALISAATIOPALVELU_SESSION_CACHE_FILE,
      JSON.stringify(Object.fromEntries(updatedSessionCache), null, 2)
    )
  } catch (e) {
    console.log(`Error writing '${LOKALISAATIOPALVELU_SESSION_CACHE_FILE}', continuing anyway`, e)
  }
}

async function loginToLokalisointi(env: Environment, useSessionCache: boolean): Promise<SessionCookies> {
  if (useSessionCache) {
    const cachedSession = (await readSessionCacheFile())?.get(env)
    if (cachedSession) {
      return cachedSession
    }
  }
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
  const sessionCookies = {
    JSESSIONID: extractCookieValue('JSESSIONID', cookiesString)
  }

  await addSessionToSessionCacheFile(env, sessionCookies)

  return sessionCookies
}

interface LocalizationIn {
  key: string
  locale: Locale
  value: string
  modified?: number
  id?: number
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

  get(key: string, locale: Locale): LocalizationIn | undefined {
    return this.localizationsByKeyAndLocale.get(key)?.get(locale)
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

async function fetchLocalizationsFromEnv(
  env: Environment,
  key: string | undefined = undefined,
  locale: Locale | undefined = undefined
): Promise<Localizations> {
  const keyParamString = key ? `&key=${key}` : ''
  const localeParamString = locale ? `&locale=${locale}` : ''
  const endpointUrl = `${localizationApiBaseUrlByEnv(
    env
  )}/localisation?value=NOCACHE&category=ludos${keyParamString}${localeParamString}`
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

async function fetchLocalizations(
  from: Environment | XlsxInput,
  key: string | undefined = undefined,
  locale: Locale | undefined = undefined
): Promise<Localizations> {
  if (isEnvironment(from)) {
    return fetchLocalizationsFromEnv(from, key, locale)
  } else if (key || locale) {
    throw new Error('Filters not supported for XLSX input')
  } else {
    return fetchLocalizationsFromXlsxInput(from)
  }
}

async function list(
  from: Environment | XlsxInput,
  key: string | undefined = undefined,
  locale: Locale | undefined = undefined
) {
  const localizations = await fetchLocalizations(from, key, locale)

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

async function deleteKeyRequest(
  from: Environment,
  idToDelete: number,
  retryWithoutSessionCache: boolean = true
): Promise<void> {
  const sessionCookies = await loginToLokalisointi(from, retryWithoutSessionCache)
  const deleteResponse = await fetch(`${localizationApiBaseUrlByEnv(from)}/localisation/${idToDelete}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'caller-id': CALLER_ID,
      Cookie: cookieString(sessionCookies)
    },
    redirect: 'manual'
  })

  if (deleteResponse.status === 302) {
    if (retryWithoutSessionCache) {
      console.log(`Delete endpoint sent a redirect so session is not valid, retrying without session cache...`)
      return await deleteKeyRequest(from, idToDelete, false)
    } else {
      throw new Error(
        `Got a redirect response from delete endpoint (to ${deleteResponse.headers.get(
          'location'
        )}), maybe the session is invalid?`
      )
    }
  } else if (deleteResponse.status !== 200) {
    throw new Error(
      `Error deleting localization id ${idToDelete} from ${from}, status=${
        deleteResponse.status
      }, response='${await deleteResponse.text()}'`
    )
  }
}

async function deleteKey(from: Environment, key: string) {
  const localizations = await fetchLocalizations(from, key)

  if (localizations.keys().length === 0) {
    console.log(`No localizations match key '${key}'`)
    return
  }

  for (const key of localizations.keys()) {
    const locales = [...localizations.localizationsByKeyAndLocale.get(key)!.keys()].sort()
    for (const locale of locales) {
      const localization = localizations.localizationsByKeyAndLocale.get(key)!.get(locale)!
      if (localization.id) {
        await deleteKeyRequest(from, localization.id)
        console.log(`Deleted key '${key}' (${locale}) with id=${localization.id} (value was "${localization.value}")`)
      } else {
        console.log(`Could not get ID for ${key} ${locale}, should be unreachable`)
      }
    }
  }
}

function formatTypescriptError(node: ts.Node, message: string) {
  const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart())
  return `${node.getSourceFile().fileName} (${line + 1},${character + 1}): ${message}`
}
function listLocalizationKeysUsedAndLintErrorsInFile(filePath: string): [Set<string>, string[]] {
  const sourceFile = ts.createSourceFile(filePath, fs.readFileSync(filePath).toString(), ts.ScriptTarget.ESNext, true)

  const keysInUse: Set<string> = new Set()
  const errors: string[] = []
  function findLocalizationKeysUsedInAstNode(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText() === 't') {
      if (node.arguments.length === 0) {
        errors.push(formatTypescriptError(node, 't function called without arguments'))
        return
      }
      if (ts.isStringLiteral(node.arguments[0])) {
        keysInUse.add(node.arguments[0].text)
      } else {
        errors.push(formatTypescriptError(node, 't function called with a non-string-literal'))
      }
    }
    node.forEachChild(findLocalizationKeysUsedInAstNode)
  }
  findLocalizationKeysUsedInAstNode(sourceFile)

  return [keysInUse, errors]
}

async function listLocalizationKeysUsedAndLintErrorsInDirectory(
  dirPath: string,
  localizationKeys: Set<string> = new Set(),
  lintErrors: string[] = []
): Promise<[Set<string>, string[]]> {
  const pathStat = await fsPromises.stat(dirPath)
  if (!pathStat.isDirectory()) {
    throw new Error(`${dirPath} is not a directory`)
  }

  const files = await fsPromises.readdir(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const fileStat = await fsPromises.stat(filePath)
    if (fileStat.isDirectory()) {
      await listLocalizationKeysUsedAndLintErrorsInDirectory(filePath, localizationKeys, lintErrors)
    } else {
      const [newLocalizationKeys, newLintErrors] = listLocalizationKeysUsedAndLintErrorsInFile(path.join(dirPath, file))
      newLocalizationKeys.forEach((k) => localizationKeys.add(k))
      newLintErrors.forEach((e) => lintErrors.push(e))
    }
  }
  return [localizationKeys, lintErrors]
}

function reportLintErrors(lintErrors: string[]) {
  lintErrors.forEach((e) => console.error(`LOCALIZATION LINT ERROR: ${e}`))
  if (lintErrors.length > 0) {
    process.exit(1)
  }
}

async function listMissing(
  from: Environment | XlsxInput,
  locale: Locale,
  errorIfMissing: boolean,
  githubActions: boolean
) {
  const localizations = await fetchLocalizations(from)
  const [localizationKeysUsedInCode, lintErrors] =
    await listLocalizationKeysUsedAndLintErrorsInDirectory(WEB_SRC_DIR_PATH)

  const missingKeys = [...localizationKeysUsedInCode].filter((key) => !localizations.get(key, locale)?.value).sort()
  if (missingKeys.length > 0) {
    if (githubActions) {
      for (const missingKey of missingKeys) {
        console.log(`::error::Localization key '${missingKey}' missing from ${from}`)
      }
    } else {
      console.log(`Keys missing from ${from}:\n  ${missingKeys.join('\n  ')}`)
    }
  }

  reportLintErrors(lintErrors)

  if (errorIfMissing && missingKeys.length > 0) {
    console.log('ERROR: Exiting with error because there are missing keys and errorIfMissing is set')
    process.exit(2)
  }
}

async function listUnused(from: Environment, deleteUnused: boolean) {
  const localizations = await fetchLocalizations(from)
  const [localizationKeysUsedInCode, lintErrors] =
    await listLocalizationKeysUsedAndLintErrorsInDirectory(WEB_SRC_DIR_PATH)

  const missingFromCode = [...localizations.keys()].filter((key) => !localizationKeysUsedInCode.has(key)).sort()

  if (missingFromCode.length > 0) {
    console.log(`${from} keys that are not in code:\n  ${missingFromCode.join('\n  ')}`)
  }

  if (deleteUnused) {
    for (const key of missingFromCode) {
      await deleteKey(from, key)
    }
  }

  reportLintErrors(lintErrors)
}

async function lint() {
  const [_, lintErrors] = await listLocalizationKeysUsedAndLintErrorsInDirectory(WEB_SRC_DIR_PATH)
  reportLintErrors(lintErrors)
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
    if (!toLocs.contains(l.key, theOtherLocale(l.locale)) && !fromLocs.contains(l.key, theOtherLocale(l.locale))) {
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

function cookieString(sessionCookies: SessionCookies): string {
  return Object.entries(sessionCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function writeLocalizationsToEnv(
  localizations: Localizations,
  to: Environment,
  retryWithoutCache: boolean = true
): Promise<void> {
  const sessionCookies = await loginToLokalisointi(to, retryWithoutCache)
  const updateResponse = await fetch(`${localizationApiBaseUrlByEnv(to)}/localisation/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'caller-id': CALLER_ID,
      Cookie: cookieString(sessionCookies)
    },
    redirect: 'manual',
    body: JSON.stringify(localizations.localizationServicePayload())
  })
  if (updateResponse.status === 302) {
    if (retryWithoutCache) {
      console.log(`Update endpoint sent a redirect so session is not valid, retrying without session cache...`)
      return await writeLocalizationsToEnv(localizations, to, false)
    } else {
      throw new Error(
        `Got a redirect response from update endpoint (to ${updateResponse.headers.get(
          'location'
        )}), maybe the session is invalid?`
      )
    }
  } else if (updateResponse.status !== 200) {
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

async function put(to: Environment, key: string, locale: Locale, value: string) {
  const newLocalization = new Localizations([{ key, locale, value }], 'command line')
  await writeLocalizationsToEnv(newLocalization, to)
}

const EnvironmentParameterType: Type<string, Environment> = {
  async from(envString: string) {
    if (isEnvironment(envString)) {
      return envString as Environment
    } else {
      throw new Error(`Unknown environment ${envString}`)
    }
  },
  description: `${Object.values(Environment).join('|')}`
}

const LocaleParameterType: Type<string, Locale> = {
  async from(localeString: string) {
    if (localeString in Locale) {
      return localeString as Locale
    } else {
      throw new Error(`Unknown environment ${localeString}`)
    }
  },
  description: `${Object.values(Locale).join('|')}`
}

const localeParameterWithDefault = option({
  type: LocaleParameterType,
  long: 'locale',
  defaultValue(): Locale {
    return Locale.fi
  },
  defaultValueIsSerializable: true
})

const localeParameterWithoutDefault = option({
  type: optional(LocaleParameterType),
  long: 'locale'
})

const XlsxInputParameter: Type<string, XlsxInput> = {
  async from(path: string) {
    return {
      workbook: XLSX.readFile(path),
      filepath: path
    }
  },
  description: `${EnvironmentParameterType.description} OR path to an existing .xlsx file`
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
  description: `${EnvironmentParameterType.description} OR Path to the .xlsx file to write`
}

const envOrXlsxInputType = union([EnvironmentParameterType, XlsxInputParameter])
const envOrXlsxOutputType = union([EnvironmentParameterType, XlsxOutputParameter])

const getCommand = command({
  name: 'get',
  description: 'get localization',
  args: {
    from: positional({ type: EnvironmentParameterType, displayName: 'from' }),
    key: positional({ type: string, displayName: 'key' }),
    locale: localeParameterWithoutDefault
  },
  handler: async (args: { from: Environment; key: string; locale: Locale | undefined }) => {
    await list(args.from, args.key, args.locale)
  }
})

const deleteCommand = command({
  name: 'delete',
  description: 'delete localization',
  args: {
    from: positional({ type: EnvironmentParameterType, displayName: 'from' }),
    key: positional({ type: string, displayName: 'key' })
  },
  handler: async (args: { from: Environment; key: string }) => {
    await deleteKey(args.from, args.key)
  }
})

const lintCommand = command({
  name: 'lint',
  description: 'Lint localization usages in frontend',
  args: {},
  handler: async (_: {}) => {
    await lint()
  }
})

const listCommand = command({
  name: 'list',
  description: 'Lists keys in an environment',
  args: {
    env: positional({ type: envOrXlsxInputType, displayName: 'environment' })
  },
  handler: async (args: { env: Environment | XlsxInput }) => {
    await list(args.env)
  }
})

const listMissingCommand = command({
  name: 'list-missing',
  description: 'Lists keys that are used in code but are missing from an environment',
  args: {
    env: positional({ type: envOrXlsxInputType, displayName: 'environment' }),
    locale: localeParameterWithDefault,
    errorIfMissing: flag({
      type: boolean,
      long: 'error-if-missing',
      description: 'Exit with error code if there are missing keys',
      defaultValue(): boolean {
        return false
      },
      defaultValueIsSerializable: true
    }),
    githubActions: flag({
      type: boolean,
      long: 'github-actions',
      description: 'print github actions workflow commands',
      defaultValue(): boolean {
        return false
      },
      defaultValueIsSerializable: true
    })
  },
  handler: async (args: {
    env: Environment | XlsxInput
    locale: Locale
    errorIfMissing: boolean
    githubActions: boolean
  }) => {
    await listMissing(args.env, args.locale, args.errorIfMissing, args.githubActions)
  }
})

const listUnusedCommand = command({
  name: 'list-unused',
  description: 'Lists keys that are in environment but not in code',
  args: {
    env: positional({ type: EnvironmentParameterType, displayName: 'environment' }),
    deleteUnused: flag({
      type: boolean,
      long: 'delete-unused',
      description: 'Delete unused keys from environment',
      defaultValue(): boolean {
        return false
      },
      defaultValueIsSerializable: true
    })
  },
  handler: async (args: { env: Environment; deleteUnused: boolean }) => {
    await listUnused(args.env, args.deleteUnused)
  }
})

const diffCommand = command({
  name: 'diff',
  description: 'Diffs keys between two environments',
  args: {
    from: positional({ type: envOrXlsxInputType, displayName: 'from' }),
    to: positional({ type: envOrXlsxInputType, displayName: 'to' })
  },
  handler: async (args: { from: Environment | XlsxInput; to: Environment | XlsxInput }) => {
    await diff(args.from, args.to, true)
  }
})

const copyCommand = command({
  name: 'copy',
  description: 'Copy new and changed localizations from one env/file to another.',
  args: {
    from: positional({ type: envOrXlsxInputType, displayName: 'from' }),
    to: positional({ type: envOrXlsxOutputType, displayName: 'to' })
  },
  handler: async (args: { from: Environment | XlsxInput; to: Environment | XlsxOutput }) => {
    await copy(args.from, args.to)
  }
})

const putCommand = command({
  name: 'put',
  description: 'Upsert localization value to environment',
  args: {
    to: positional({ type: EnvironmentParameterType, displayName: 'to' }),
    key: positional({ type: string, displayName: 'key' }),
    value: positional({ type: string, displayName: 'value' }),
    locale: localeParameterWithDefault
  },
  handler: async (args: { to: Environment; key: string; locale: Locale; value: string }) => {
    await put(args.to, args.key, args.locale, args.value)
  }
})

const app = subcommands({
  name: 'localizations',
  description: `Manage LUDOS localizations.
  
     Write operations to an environment require your virkailija credentials
     in ~/.oph-credentials.json format:
     {"qa": {"username": "foo", "password: "bar"}}
     
     For prod (and other accounts with MFA enabled), use the ludos_localizations service
     user, password can be found in utility Secrets Manager:
     /prod/scripts/localizations_service_user`.replace(/  +/g, ''),
  version: '1.0.0',
  cmds: {
    get: getCommand,
    delete: deleteCommand,
    lint: lintCommand,
    list: listCommand,
    'list-missing': listMissingCommand,
    'list-unused': listUnusedCommand,
    diff: diffCommand,
    copy: copyCommand,
    put: putCommand
  }
})

await run(app, process['argv'].slice(2))
