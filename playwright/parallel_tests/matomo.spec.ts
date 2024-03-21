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
    (request) => request.url().includes(layout.partialMatomoAnalyticsUrl) && request.method() === 'GET'
  )
}

test.describe('Matomo', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, Role.YLLAPITAJA)
  })

  test('should open on first page load and send requests after full cookie consent', async ({ page }) => {
    const layout = new LayoutModel(page)
    await page.goto('/')
    void layout.acceptAllCookies()

    await waitForMatomoRequest(layout)

    await layout.headerSuko.click()
    await waitForMatomoRequest(layout)

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
    await layout.consentModalAcceptSelectedButton.click()
    await waitForMatomoRequest(layout)
  })
})
