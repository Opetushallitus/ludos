import { BrowserContext, expect, Page, test as importedTest } from '@playwright/test'
import { TeachingLanguage } from 'web/src/types'

export type FormAction = 'submit' | 'draft' | 'cancel' | 'delete'

export const Role = {
  YLLAPITAJA: 'YLLAPITAJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const Exam = {
  Suko: 'SUKO',
  Puhvi: 'PUHVI',
  Ld: 'LD'
} as const
export type Exam = (typeof Exam)[keyof typeof Exam]
export const examsLowerCase = Object.values(Exam).map((e) => e.toLocaleLowerCase())

export const ContentType = {
  koetehtavat: 'koetehtavat',
  ohjeet: 'ohjeet',
  todistukset: 'todistukset'
} as const

export const authFileByRole: Record<Role, string> = Object.fromEntries(
  Object.values(Role).map((role) => [role, `.auth/${role}.json`])
) as Record<Role, string>

export async function login(page: Page, role: Role) {
  await page.goto(`/api/test/mocklogin/${role}`)
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
