import { expect, test as setup } from '@playwright/test'
import { Role, authFileByRole, login } from './helpers'

Object.values(Role).forEach((role: Role) => {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await login(page, role)
    if (role === Role.UNAUTHORIZED) {
      await expect(page.getByTestId('unauthorizedPage')).toBeVisible()
    } else {
      await expect(page.getByTestId('header-user-role')).toHaveText(role)
    }
    await page.context().storageState({ path: authFileByRole[role] })
  })
})
