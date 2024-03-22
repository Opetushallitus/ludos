import { LayoutModel } from '../../models/LayoutModel'

require('dotenv').config({ path: '.env' })
import { expect, test } from '@playwright/test'

const casLoginUrl =
  'https://virkailija.untuvaopintopolku.fi/cas/login?service=http%3A%2F%2Flocalhost%3A8080%2Fj_spring_cas_security_check'

const USERNAME_ENV_VARIABLE = 'TESTIKAYTTAJA_YLLAPITAJA_USERNAME'
const PASSWORD_END_VARIABLE = 'TESTIKAYTTAJA_YLLAPITAJA_PASSWORD'
test('yllapitaja can login and logout', async ({ page }) => {
  const username = process.env[USERNAME_ENV_VARIABLE]
  const password = process.env[PASSWORD_END_VARIABLE]
  if (!username || !password) {
    throw new Error(`${USERNAME_ENV_VARIABLE} or ${PASSWORD_END_VARIABLE} not set`)
  }
  await page.goto('/vitelogin')
  await page.waitForURL(casLoginUrl)
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.locator('input[type=submit]').click()
  await new LayoutModel(page).acceptOnlyNecessaryCookies()
  await expect(page.getByTestId('page-heading-etusivu')).toContainText('Hei Ludos, tervetuloa LUDOS-palveluun!')

  await page.getByTestId('user-menu-expand').click()
  await page.getByTestId('logout-button').click()
  await page.waitForURL(casLoginUrl)
})
