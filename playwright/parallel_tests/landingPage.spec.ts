import { expect, test } from '@playwright/test'
import { Language } from 'web/src/types'
import { loginTestGroup, Role } from '../helpers'
import { LayoutModel } from '../models/LayoutModel'

const deepLink = '/suko/koetehtavat?foo=bar'
const landingPageUrl = `/kirjaudu?to=${encodeURIComponent(deepLink)}`

test.describe('Landing page as anonymous user', () => {
  test('deep link redirects to landing page with login link carrying the deep link', async ({ page }) => {
    await page.goto(deepLink)

    await expect(page).toHaveURL(landingPageUrl)
    await expect(page.getByRole('heading', { name: 'Tervetuloa Ludos-palveluun' })).toBeVisible()
    await expect(page.getByTestId('login-button')).toHaveAttribute(
      'href',
      `/api/auth/login?to=${encodeURIComponent(deepLink)}`
    )
  })

  test('front page redirects to landing page without a deep link', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/kirjaudu')
    await expect(page.getByTestId('login-button')).toHaveAttribute(
      'href',
      `/api/auth/login?to=${encodeURIComponent('/')}`
    )
  })

  test('language can be changed to Swedish and back', async ({ page }) => {
    const layout = new LayoutModel(page)
    await page.goto('/kirjaudu?lang=fi')
    await layout.acceptAllCookies()

    await layout.setUiLanguage(Language.SV)
    await expect(page.getByRole('heading', { name: 'Välkommen till Ludos-tjänsten' })).toBeVisible()
    await expect(page.getByTestId('login-button')).toHaveText('Logga in')
    await expect(page.locator('html')).toHaveAttribute('lang', 'sv')
    await expect(page).toHaveTitle('LUDOS – Logga in')
    await expect(layout.footerFeedbackLink).toHaveText('Ge respons')

    await layout.setUiLanguage(Language.FI)
    await expect(page.getByRole('heading', { name: 'Tervetuloa Ludos-palveluun' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fi')
  })
})

test.describe('Landing page as logged in user', () => {
  loginTestGroup(test, Role.YLLAPITAJA)

  test('login button leads to the deep link', async ({ page }) => {
    await page.goto(landingPageUrl)
    await page.getByTestId('login-button').click()

    await expect(page).toHaveURL(deepLink)
  })

  test('login does not redirect off-site', async ({ page }) => {
    const response = await page.request.get(`/api/auth/login?to=${encodeURIComponent('//evil.com')}`, {
      maxRedirects: 0
    })

    expect(response.status()).toBe(302)
    const location = new URL(response.headers().location, response.url())
    expect(location.host).toBe(new URL(response.url()).host)
    expect(location.pathname).toBe('/')
  })
})
