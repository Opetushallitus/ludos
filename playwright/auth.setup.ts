import { expect, test as setup } from '@playwright/test'
import { authFileByRole, login, Role } from './helpers'

Object.values(Role).forEach((role: Role) => {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await login(page, role)

    if (role === Role.UNAUTHORIZED) {
      await expect(page.getByTestId('unauthorizedPage')).toBeVisible()
    } else {
      const expectedRoleText = role === Role.YLLAPITAJA ? 'ylläpitäjä' : 'opettaja'
      await expect(page.getByTestId('header-user-role')).toHaveText(expectedRoleText)
    }
    await page.context().storageState({ path: authFileByRole[role] })
  })
})
