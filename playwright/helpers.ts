import { BrowserContext, expect, Locator, Page, test as importedTest } from '@playwright/test'
import { Exam, KoodistoName, Language } from 'web/src/types'
import { promises as fsPromises } from 'fs'
import path from 'path'

export type FormAction = 'submit' | 'draft' | 'cancel' | 'delete'

export const Role = {
  YLLAPITAJA: 'YLLAPITAJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const examsLowerCase = Object.values(Exam).map((e) => e.toLocaleLowerCase())

export const authFileByRole: Record<Role, string> = Object.fromEntries(
  Object.values(Role).map((role) => [role, `.auth/${role}.json`])
) as Record<Role, string>

export async function login(page: Page, role: Role, asiointiKieli?: string) {
  const urlParams = new URLSearchParams()
  if (asiointiKieli) {
    urlParams.set('asiointiKieli', asiointiKieli)
  }
  await page.goto(`/api/test/mocklogin/${role}?${urlParams.toString()}`)
}

export function loginTestGroup(test: typeof importedTest, role: Role) {
  test.use({ storageState: authFileByRole[role] })
}

export async function fetchWithSession(
  context: BrowserContext,
  url: string,
  method: 'POST' | 'PUT' | 'GET',
  body?: string | FormData
) {
  const storageState = await context.storageState()
  const sessionCookie = storageState.cookies.find((cookie) => cookie.name === 'SESSION')
  const xsrfToken = storageState.cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')

  if (!sessionCookie || !xsrfToken) {
    throw new Error('Cookies not found from storagestate, did you authenticate?')
  }

  const headers: { [key: string]: string } = {
    Cookie: `SESSION=${sessionCookie.value}; XSRF-TOKEN=${xsrfToken.value};`
  }

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return await fetch(url, {
    method,
    body,
    credentials: 'include',
    headers: {
      ...headers,
      'X-XSRF-TOKEN': xsrfToken.value
    }
  })
}

const koodistoCache: { [key in KoodistoName]?: object[] } = {}

async function readKoodistoFile(koodistoName: KoodistoName): Promise<object[]> {
  const koodistoFilePath = path.join(
    __dirname,
    '..',
    'server',
    'src',
    'main',
    'resources',
    'backup_data',
    `koodisto_${koodistoName}.json`
  )
  return JSON.parse(await fsPromises.readFile(koodistoFilePath, { encoding: 'utf-8' }))
}

export async function koodiNimi(
  koodistoName: KoodistoName,
  koodiArvo: string,
  language: Language = Language.FI
): Promise<string> {
  let koodisto = koodistoCache[koodistoName]
  if (!koodisto) {
    koodistoCache[koodistoName] = await readKoodistoFile(koodistoName)
    koodisto = koodistoCache[koodistoName]
  }
  const koodi: any = koodisto?.find((k: any) => k['koodiArvo'] === koodiArvo)
  if (!koodi) {
    throw new Error(`Could not find koodiArvo ${koodiArvo} from koodisto ${koodistoName}`)
  } else {
    const koodiMetadata = koodi['metadata'].find((m: any) => m['kieli'] === language.toUpperCase())
    if (!koodiMetadata) {
      const errorMessage = `Could not find language ${language} for koodiArvo ${koodiArvo} in koodisto ${koodistoName}`
      throw new Error(errorMessage)
    } else {
      return koodiMetadata['nimi']
    }
  }
}

export async function setMultiSelectDropdownOptions(page: Page, dropdownTestId: string, optionIds: string[]) {
  if (await page.getByTestId(`${dropdownTestId}-reset-selected-options`).isVisible()) {
    await page.getByTestId(`${dropdownTestId}-reset-selected-options`).click()
  }

  for (const option of optionIds) {
    await page.getByTestId(`${dropdownTestId}-open`).click()
    await page.getByTestId(`${dropdownTestId}-option-${option}`).click()
  }
}

export async function setSingleSelectDropdownOption(page: Page, dropdownTestId: string, optionId: string) {
  await page.getByTestId(`${dropdownTestId}-open`).click()
  await page.getByTestId(`${dropdownTestId}-option-${optionId}`).click()
}

export async function setTeachingLanguage(page: Page, teachingLanguage: Language) {
  await setSingleSelectDropdownOption(page, 'teachingLanguageDropdown', teachingLanguage)
}

export async function assertSuccessNotification(page: Page, notificationLocalisationKey: string) {
  const successNotification = page.getByTestId('notification-success')
  await expect(successNotification).toBeVisible()

  await expect(successNotification.getByText(notificationLocalisationKey)).toBeVisible()
}

export async function assertFailureNotification(page: Page, notificationLocalisationKey: string) {
  const errorNotification = page.getByTestId('notification-error')
  await expect(errorNotification).toBeVisible()
  await expect(errorNotification).toHaveText(
    `error${notificationLocalisationKey}notification.error.link.laheta-palautetta-virheestaopen_in_newclose`
  )
}

export async function assertInputValues(page: Page, inputName: string, expectedValues: string[]): Promise<void> {
  const locators = await page.locator(`input[name="${inputName}"]`).all()
  const values = await Promise.all(locators.map((l) => l.inputValue()))
  expect(values.sort()).toEqual(expectedValues.slice().sort())
}

export async function koodiLabel(
  koodistoName: KoodistoName,
  koodiArvos: string | string[],
  teachingLanguage: Language = Language.FI
): Promise<string> {
  if (typeof koodiArvos === 'string') {
    return koodiNimi(koodistoName, koodiArvos, teachingLanguage)
  } else {
    const labels = await Promise.all(koodiArvos.map((ka) => koodiLabel(koodistoName, ka)))
    return labels.sort().join(', ')
  }
}

export const mapPromiseAll =
  <T, U>(fn: (arg: T) => Promise<U>) =>
  (args: T[]) =>
    Promise.all(args.map(fn))

export function createFilePathToFixtures(filename: string) {
  return path.resolve(__dirname, `../server/src/main/resources/fixtures/${filename}`)
}

export async function selectAttachmentFile(page: Page, file: string, locator: Locator, canBeOpened: boolean = false) {
  const filePath = createFilePathToFixtures(file)

  await locator.setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file).first()).toHaveText(`${file}${canBeOpened ? 'open_in_new' : ''}${formattedDate}`)
}
