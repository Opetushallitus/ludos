import { expect, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'
import { LayoutModel } from '../models/LayoutModel'

loginTestGroup(test, Role.OPETTAJA)

const FEEDBACK_EMAIL = 'mailto:lukio@oph.fi'
const SUBJECT_PREFIX = 'Palautetta tehtävästä: '

async function assertTehtavaFeedbackLink(layout: LayoutModel, pageUrl: string) {
  const href = await layout.tehtavaFeedbackLink.getAttribute('href')
  const expectedSubject = encodeURIComponent(SUBJECT_PREFIX + pageUrl)
  expect(href).toBe(`${FEEDBACK_EMAIL}?subject=${expectedSubject}`)
}

test.describe('feedback link', () => {
  test('footer feedback link points to plain email without subject', async ({ page }) => {
    await page.goto('/')
    const layout = new LayoutModel(page)
    await expect(layout.footerFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })

  test('First Suko tehtävä feedback link includes page url in subject', async ({ page }) => {
    await page.goto('/suko/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await assertTehtavaFeedbackLink(layout, page.url())
  })

  test('First lukiodiplomit feedback link includes page url in subject', async ({ page }) => {
    await page.goto('/ld/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await assertTehtavaFeedbackLink(layout, page.url())
  })

  test('First puheviestintä feedback link includes page url in subject', async ({ page }) => {
    await page.goto('/puhvi/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await assertTehtavaFeedbackLink(layout, page.url())
  })
})
