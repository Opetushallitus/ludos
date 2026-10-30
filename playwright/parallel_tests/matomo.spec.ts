import path from 'node:path'
import { expect, test } from '@playwright/test'
import { login, Role } from '../helpers'
import { LayoutModel } from '../models/LayoutModel'

async function checkForMatomoAnalyticsRequest(layout: LayoutModel, shouldExist = true) {
  let matomoAnalyticsRequestDone = false

  layout.page.on('request', (request) => {
    if (request.url().includes(layout.partialMatomoAnalyticsUrl)) {
      matomoAnalyticsRequestDone = true
    }
  })

  await layout.acceptOnlyNecessaryCookies()
  await layout.page.waitForTimeout(500)

  if (shouldExist) {
    expect(matomoAnalyticsRequestDone).toBe(true)
  } else {
    expect(matomoAnalyticsRequestDone).toBe(false)
  }
}

async function waitForMatomoRequest(layout: LayoutModel) {
  await layout.page.waitForRequest(
    (request) => request.url().includes(layout.partialMatomoAnalyticsUrl) && ['GET', 'POST'].includes(request.method())
  )
}

test.describe('Matomo', () => {
  test.beforeEach(async ({ page }) => {
    // shortcut: tests pin Matomo 5.5.0, refresh the fixture when the deployed tracker is upgraded.
    await page.route('**://analytiikka.opintopolku.fi/matomo/matomo.js', (route) =>
      route.fulfill({
        path: path.join(__dirname, '../fixtures/matomo/matomo.js'),
        contentType: 'application/javascript'
      })
    )
    await page.route('**://analytiikka.opintopolku.fi/matomo/matomo.php?**', (route) => route.fulfill({ status: 204 }))
    await login(page, Role.YLLAPITAJA)
  })

  test('should open on first page load and send requests after full cookie consent', async ({ page }) => {
    const layout = new LayoutModel(page)
    await page.goto('/')
    await Promise.all([waitForMatomoRequest(layout), layout.acceptAllCookies()])

    await Promise.all([waitForMatomoRequest(layout), layout.headerSuko.click()])

    await page.reload()
    await expect(layout.consentModal).toBeHidden()
  })

  test('should open on first page load and doesnt send requests after necessary cookie consent', async ({ page }) => {
    const layout = new LayoutModel(page)
    await page.goto('/')
    await checkForMatomoAnalyticsRequest(layout, false)
  })

  test('settings should open from footer link', async ({ page }) => {
    const layout = new LayoutModel(page)
    await page.goto('/')

    await checkForMatomoAnalyticsRequest(layout, false)

    await layout.consentModalFooterButton.click()
    await layout.consentModalSettingsButton.click()
    await layout.consentModalTrackingCheckbox.check()
    await Promise.all([waitForMatomoRequest(layout), layout.consentModalAcceptSelectedButton.click()])
  })
})
