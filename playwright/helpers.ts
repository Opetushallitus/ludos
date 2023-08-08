import { Page, test as importedTest } from '@playwright/test'

export const Role = {
  YLLAPITAJA: 'YLLAPITAJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
}
export type Role = (typeof Role)[keyof typeof Role]

export const authFileByRole: Record<Role, string> = Object.fromEntries(
  Object.values(Role).map((role) => [role, `.auth/${role}.json`])
)

export async function login(page: Page, role: Role) {
  await page.goto(`/api/test/mocklogin/${role}`)
}

export function loginTestGroup(test: typeof importedTest, role: Role) {
  test.use({ storageState: authFileByRole[role] })
}
