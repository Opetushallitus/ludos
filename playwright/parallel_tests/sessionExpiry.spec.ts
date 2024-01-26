import { expect, Page, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'
import { ContentType, ContentTypeSingularEng, Exam } from 'web/src/types'
import { fillAssignmentForm, formDataForCreate } from '../examHelpers/assignmentHelpers'
import { fillCertificateForm } from '../examHelpers/certificateHelpers'
import { instructionFormData } from '../examHelpers/instructionHelpers'
import { InstructionFormModel } from '../models/InstructionFormModel'
import { CertificateFormModel } from '../models/CertificateFormModel'

async function assertSessionExpiryFormErrorMessage(page: Page) {
  const formErrorMessageLocator = page.getByTestId('session-expired-error-message')
  await expect(formErrorMessageLocator).toBeVisible()

  const newTabPromise = page.context().waitForEvent('page')

  await formErrorMessageLocator.getByTestId('link').click()

  const newTab = await newTabPromise
  await newTab.close()
}

async function clearCookiesAndSubmit(page: Page, contentType: string) {
  await page.context().clearCookies()
  void page.getByTestId('form-submit').click()
  await page.waitForResponse((response) => response.url().includes(`/api/${contentType}`) && response.status() === 302)
}

Object.values(Exam).forEach((exam) => {
  loginTestGroup(test, Role.YLLAPITAJA)
  test.describe(`Session expiry test for ${exam}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await expect(page.getByTestId('page-heading-etusivu')).toBeVisible()
    })

    test('should redirect refresh the browser on session expiry', async ({ page }) => {
      await page.context().clearCookies()

      void page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
      await page.waitForResponse(
        (response) => response.url().includes(`/api/${ContentTypeSingularEng.koetehtavat}`) && response.status() === 302
      )

      await page.waitForResponse(
        (resp) => {
          const url = new URL(resp.url())
          return url.pathname === `/${exam.toLowerCase()}/${ContentType.koetehtavat}`
        },
        {
          timeout: 5000
        }
      )
    })

    test(`should show error notification and message on submit ${exam} assignment form`, async ({ page }) => {
      await page.goto(`/${exam}/${ContentType.koetehtavat}/uusi`)
      const createFormData = formDataForCreate(exam, 'submit')
      await fillAssignmentForm(page, createFormData)
      await clearCookiesAndSubmit(page, ContentTypeSingularEng.koetehtavat)
      await assertSessionExpiryFormErrorMessage(page)
    })

    test(`should show error notification and message on submit ${exam} instruction form`, async ({ page }) => {
      const form = new InstructionFormModel(page, exam)
      await page.goto(`/${exam}/${ContentType.ohjeet}/uusi`)
      await form.fillInstructionForm(instructionFormData)
      await clearCookiesAndSubmit(page, ContentTypeSingularEng.ohjeet)
      await assertSessionExpiryFormErrorMessage(page)
    })

    test(`should show error notification and message on submit ${exam} certificate form`, async ({ page }) => {
      const form = new CertificateFormModel(page, exam)
      await page.goto(`/${exam}/${ContentType.todistukset}/uusi`)
      const inputs = form.createCertificateInputs('submit')
      await fillCertificateForm(page, exam, inputs)
      await clearCookiesAndSubmit(page, ContentTypeSingularEng.todistukset)
      await assertSessionExpiryFormErrorMessage(page)
    })
  })
})
