import { expect, Page, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'
import { ContentTypePluralFi, ContentTypeSingularEn, Exam } from 'web/src/types'
import { createFormData, fillAssignmentForm } from '../examHelpers/assignmentHelpers'
import { fillCertificateForm } from '../examHelpers/certificateHelpers'
import { instructionFormData } from '../examHelpers/instructionHelpers'
import { InstructionFormModel } from '../models/InstructionFormModel'
import { CertificateFormModel } from '../models/CertificateFormModel'
import { AssignmentFormModel } from '../models/AssignmentFormModel'

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
        (response) => response.url().includes(`/api/${ContentTypeSingularEn.ASSIGNMENT}`) && response.status() === 302
      )

      await page.waitForResponse(
        (resp) => {
          const url = new URL(resp.url())
          return url.pathname === `/${exam.toLowerCase()}/${ContentTypePluralFi.ASSIGNMENT}`
        },
        {
          timeout: 5000
        }
      )
    })

    test(`should show error notification and message on submit ${exam} assignment form`, async ({ page }) => {
      await page.goto(`/${exam}/${ContentTypePluralFi.ASSIGNMENT}/uusi`)
      const formData = createFormData(exam, 'submit')
      await fillAssignmentForm(new AssignmentFormModel(page, exam), formData)
      await clearCookiesAndSubmit(page, ContentTypeSingularEn.ASSIGNMENT)
      await assertSessionExpiryFormErrorMessage(page)
    })

    test(`should show error notification and message on submit ${exam} instruction form`, async ({ page }) => {
      const form = new InstructionFormModel(page, exam)
      await page.goto(`/${exam}/${ContentTypePluralFi.INSTRUCTION}/uusi`)
      await form.fillInstructionForm(instructionFormData)
      await clearCookiesAndSubmit(page, ContentTypeSingularEn.INSTRUCTION)
      await assertSessionExpiryFormErrorMessage(page)
    })

    test(`should show error notification and message on submit ${exam} certificate form`, async ({ page }) => {
      const form = new CertificateFormModel(page, exam)
      await form.gotoNew()
      const inputs = form.createFormData('submit')
      await fillCertificateForm(form, inputs)
      await clearCookiesAndSubmit(page, ContentTypeSingularEn.CERTIFICATE)
      await assertSessionExpiryFormErrorMessage(page)
    })
  })
})
