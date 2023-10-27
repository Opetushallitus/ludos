import { BrowserContext, expect, Page, test as importedTest } from '@playwright/test'
import { Exam, KoodistoName, TeachingLanguage } from 'web/src/types'
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

export const ContentType = {
  koetehtavat: 'koetehtavat',
  ohjeet: 'ohjeet',
  todistukset: 'todistukset'
} as const

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

export async function postWithSession(context: BrowserContext, url: string, body: string) {
  const storageState = await context.storageState()
  const sessionCookie = storageState.cookies.find((cookie) => cookie.name === 'SESSION')
  if (!sessionCookie) {
    throw new Error('Session cookie not found from storagestate, did you authenticate?')
  }
  return await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `SESSION=${sessionCookie?.value}`
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
  language: 'FI' | 'SV' = 'FI'
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
    const koodiMetadata = koodi['metadata'].find((m: any) => m['kieli'] === language)
    if (!koodiMetadata) {
      throw new Error(`Could not find language ${language} for koodiArvo ${koodiArvo} in koodisto ${koodistoName}`)
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

export async function setTeachingLanguage(page: Page, teachingLanguage: TeachingLanguage) {
  await setSingleSelectDropdownOption(page, 'teachingLanguageDropdown', teachingLanguage)
}

export async function assertSuccessNotification(page: Page, notificationLocalisationKey: string) {
  await expect(page.getByText(notificationLocalisationKey)).toBeVisible()
}

export async function assertInputValues(page: Page, inputName: string, expectedValues: string[]): Promise<void> {
  const locators = await page.locator(`input[name="${inputName}"]`).all()
  const values = await Promise.all(locators.map((l) => l.inputValue()))
  expect(values.sort()).toEqual(expectedValues.slice().sort())
}

export async function koodiLabel(koodistoName: KoodistoName, koodiArvos: string | string[]): Promise<string> {
  if (typeof koodiArvos === 'string') {
    return koodiNimi(koodistoName, koodiArvos)
  } else {
    const labels = await Promise.all(koodiArvos.map((ka) => koodiLabel(koodistoName, ka)))
    return labels.sort().join(', ')
  }
}
