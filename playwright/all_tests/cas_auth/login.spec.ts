require('dotenv').config({ path: '.env' })
import { test, expect } from '@playwright/test'

const casLoginUrl =
  'https://virkailija.untuvaopintopolku.fi/cas/login?service=http%3A%2F%2Flocalhost%3A8080%2Fj_spring_cas_security_check'

test('yllapitaja can login and logout', async ({ page }) => {
  await page.goto('/vitelogin')
  await page.waitForURL(casLoginUrl)
  await page.locator('#username').fill(process.env.TESTIKAYTTAJA_YLLAPITAJA_USERNAME!)
  await page.locator('#password').fill(process.env.TESTIKAYTTAJA_YLLAPITAJA_PASSWORD!)
  await page.locator('input[type=submit]').click()
  await expect(page.getByTestId('page-heading-etusivu')).toContainText('Hei Ludos, tervetuloa LUDOS-palveluun!')

  await page.getByTestId('header-user-dropdown-expand').click()
  await page.getByTestId('logout-button').click()
  await page.waitForURL(casLoginUrl)
})
