import { expect, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role } from '../helpers'
import { CertificateContentListModel } from '../models/CertificateContentListModel'
import { LayoutModel } from '../models/LayoutModel'

loginTestGroup(test, Role.OPETTAJA)

const FEEDBACK_EMAIL = 'mailto:lukio@oph.fi'

test.describe('feedback link', () => {
  test('footer feedback link points to email', async ({ page }) => {
    await page.goto('/')
    const layout = new LayoutModel(page)
    await expect(layout.footerFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })

  test('footer feedback link is visible on certificate content list page', async ({ page }) => {
    const puhviCertificateContentList = new CertificateContentListModel(page, Exam.PUHVI)
    await puhviCertificateContentList.goto()
    const layout = new LayoutModel(page)
    await expect(layout.footerFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })

  test('First Suko tehtävä feedback link points to email', async ({ page }) => {
    await page.goto('/suko/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await expect(layout.tehtavaFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })

  test('First lukiodiplomit feedback link points to email', async ({ page }) => {
    await page.goto('/ld/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await expect(layout.tehtavaFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })

  test('First puheviestintä feedback link points to email', async ({ page }) => {
    await page.goto('/puhvi/koetehtavat')
    const layout = new LayoutModel(page)
    await page.getByTestId('card-title').first().click()
    await expect(layout.tehtavaFeedbackLink).toHaveAttribute('href', FEEDBACK_EMAIL)
  })
})