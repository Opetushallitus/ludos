require('dotenv').config({ path: '../.env' })
import { test, expect } from '@playwright/test'

const casLoginUrl =
  'https://virkailija.untuvaopintopolku.fi/cas/login?service=http%3A%2F%2Flocalhost%3A8080%2Fj_spring_cas_security_check'

test('yllapitaja can login and logout', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL(casLoginUrl)
  await page.getByPlaceholder('Käyttäjätunnus').fill(process.env.TESTIKAYTTAJA_YLLAPITAJA_USERNAME!)
  await page.getByPlaceholder('Salasana').fill(process.env.TESTIKAYTTAJA_YLLAPITAJA_PASSWORD!)
  await page.getByRole('button', { name: 'Kirjaudu' }).click()
  await expect(page.getByTestId('page-heading-etusivu')).toContainText(process.env.TESTIKAYTTAJA_YLLAPITAJA_USERNAME!)

  await page.getByRole('button', { name: 'ludos_yllapitaja expand_more' }).click()
  await page.getByText('Kirjaudu ulos').click()
  await page.goto('/')
  await page.waitForURL(casLoginUrl)
})
