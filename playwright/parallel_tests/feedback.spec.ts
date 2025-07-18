import { expect, Locator, Page, test } from '@playwright/test'
import { Exam, Language } from 'web/src/types'
import { loginTestGroup, Role } from '../helpers'
import { CertificateContentListModel } from '../models/CertificateContentListModel'
import { LayoutModel } from '../models/LayoutModel'

loginTestGroup(test, Role.OPETTAJA)

test.describe('feedback link', () => {
  async function assertFeedbackLink(
    page: Page,
    feedbackLink: Locator,
    expectedLanguage: Language,
    lastHref: string
  ): Promise<string> {
    await expect(feedbackLink).toHaveAttribute('href', new RegExp(`.*ref=${encodeURIComponent(page.url())}.*`))
    await expect(feedbackLink).toHaveAttribute('href', new RegExp(`.*language=${expectedLanguage.toLowerCase()}.*`))
    const href = (await feedbackLink.getAttribute('href'))!
    expect(href).not.toEqual(lastHref)
    return href
  }

  test('footer feedback link works', async ({ page }) => {
    await page.goto('/')
    const layout = new LayoutModel(page)
    let lastHref = await layout.footerFeedbackLink.getAttribute('href')
    expect(lastHref).not.toBeFalsy()
    const puhviCertificateContentList = new CertificateContentListModel(page, Exam.PUHVI)
    await puhviCertificateContentList.goto()

    await layout.setUiLanguage(Language.FI)
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, Language.FI, lastHref!)

    await puhviCertificateContentList.setOrder('asc')
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, Language.FI, lastHref)

    await puhviCertificateContentList.setOrder('desc')
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, Language.FI, lastHref)

    await layout.setUiLanguage(Language.SV)
    await assertFeedbackLink(page, layout.footerFeedbackLink, Language.SV, lastHref)
  })

  test('First Suko tehtävä feedback link works', async ({ page }) => {
    await page.goto('/suko/koetehtavat')

    const layout = new LayoutModel(page)
    await layout.setUiLanguage(Language.FI)
    await page.getByTestId('card-title').first().click()
    await assertFeedbackLink(page, layout.tehtavaFeedbackLink, Language.FI, '/')
  })

  test('First lukiodiplomit feedback link works', async ({ page }) => {
    await page.goto('/ld/koetehtavat')

    const layout = new LayoutModel(page)
    await layout.setUiLanguage(Language.FI)
    await page.getByTestId('card-title').first().click()
    await assertFeedbackLink(page, layout.tehtavaFeedbackLink, Language.FI, '/')
  })

  test('First puheviestintä feedback link works', async ({ page }) => {
    await page.goto('/puhvi/koetehtavat')

    const layout = new LayoutModel(page)
    await layout.setUiLanguage(Language.FI)
    await page.getByTestId('card-title').first().click()
    await assertFeedbackLink(page, layout.tehtavaFeedbackLink, Language.FI, '/')
  })
})
