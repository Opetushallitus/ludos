import { expect, Locator, Page, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'
import { BusinessLanguage, Exam } from 'web/src/types'
import { CertificateContentListModel } from '../models/CertificateContentListModel'
import { LayoutModel } from '../models/LayoutModel'

loginTestGroup(test, Role.OPETTAJA)

test.describe('feedback link', async () => {
  async function assertFeedbackLink(
    page: Page,
    feedbackLink: Locator,
    expectedLanguage: BusinessLanguage,
    lastHref: string
  ): Promise<string> {
    await expect(feedbackLink).toHaveAttribute('href', new RegExp(`.*ref=${encodeURIComponent(page.url())}.*`))
    await expect(feedbackLink).toHaveAttribute('href', new RegExp(`.*language=${expectedLanguage}.*`))
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

    await layout.setUiLanguage(BusinessLanguage.fi)
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, BusinessLanguage.fi, lastHref!)

    await puhviCertificateContentList.setOrder('asc')
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, BusinessLanguage.fi, lastHref)

    await puhviCertificateContentList.setOrder('desc')
    lastHref = await assertFeedbackLink(page, layout.footerFeedbackLink, BusinessLanguage.fi, lastHref)

    await layout.setUiLanguage(BusinessLanguage.sv)
    await assertFeedbackLink(page, layout.footerFeedbackLink, BusinessLanguage.sv, lastHref)

    await page.goto((await layout.footerFeedbackLink.getAttribute('href'))!) // avaa samaan tabiin
    // Jostain syystä githubissa tulee aina virheilmoitus lomaakkeen latautumisen sijaan
    await expect(page.getByText(/(Kundrespons om tjänsten LUDOS|Responsen kunde inte laddas)/)).toBeVisible()
  })
})
