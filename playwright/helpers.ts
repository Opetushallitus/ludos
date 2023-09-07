import { BrowserContext, Page, test as importedTest } from '@playwright/test'

export const Role = {
  YLLAPITAJA: 'YLLAPITAJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
}
export type Role = (typeof Role)[keyof typeof Role]

export const Exam = {
  Suko: 'SUKO',
  Puhvi: 'PUHVI',
  Ld: 'LD'
} as const

export type Exam = (typeof Exam)[keyof typeof Exam]

export const authFileByRole: Record<Role, string> = Object.fromEntries(
  Object.values(Role).map((role) => [role, `.auth/${role}.json`])
)

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
  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `SESSION=${sessionCookie?.value}`
    }
  })
  return response
}
