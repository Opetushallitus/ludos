import { expect, Page, test } from '@playwright/test'
import { initializeInstructionTest, updateAttachments } from '../../examHelpers/instructionHelpers'
import { assertSuccessNotification, loginTestGroup, Role } from '../../helpers'
import { Exam } from 'web/src/types'
import { InstructionFormModel } from '../../models/InstructionFormModel'

async function createAndUpdatePublishedInstruction(page: Page, exam: Exam) {
  const form = new InstructionFormModel(page, exam)

  const instructionId = await form.createInstruction('submit', 'form.notification.ohjeen-tallennus.julkaisu-onnistui')
  await form.updateInstruction(instructionId, 'submit', 'Testuppgifter', 'form.notification.ohjeen-tallennus.onnistui')
  await updateAttachments(page)
  await form.updateInstruction(
    instructionId,
    'draft',
    'Testuppgifter redigerade',
    'form.notification.ohjeen-tallennus.palautettu-luonnostilaan'
  )

  await deleteInstruction(page, instructionId, exam)
}

async function createAndUpdateDraftInstruction(page: Page, exam: Exam) {
  const form = new InstructionFormModel(page, exam)

  const instructionId = await form.createInstruction('draft', 'form.notification.ohjeen-tallennus.luonnos-onnistui')

  await form.updateInstruction(instructionId, 'draft', 'Testuppgifter', 'form.notification.ohjeen-tallennus.onnistui')
  await form.updateInstruction(
    instructionId,
    'submit',
    'Testuppgifter redigerade',
    'form.notification.ohjeen-tallennus.julkaisu-onnistui'
  )

  await deleteInstruction(page, instructionId, exam)
}
async function deleteInstruction(page: Page, instructionId: number, exam: Exam) {
  await page.getByTestId('edit-content-btn').click()

  await page.getByTestId('form-delete').click()
  await page.getByTestId('modal-button-delete').last().click()

  await assertSuccessNotification(page, 'ohjeen-poisto.onnistui')
  // expect not to find the deleted certificate from a list
  await expect(page.getByTestId(`instruction-${instructionId}`)).toBeHidden()

  await page.goto(`/${exam.toLowerCase()}/ohjeet/${instructionId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

loginTestGroup(test, Role.YLLAPITAJA)

Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction form tests`, () => {
    test.beforeEach(async ({ page }) => await initializeInstructionTest(page, exam))

    test(`can create, update and delete a new published ${exam} instruction`, async ({ page }) =>
      await createAndUpdatePublishedInstruction(page, exam))

    test(`can create, update and delete a new draft ${exam} instruction`, async ({ page }) =>
      await createAndUpdateDraftInstruction(page, exam))

    test(`can cancel ${exam} creating instruction`, async ({ page }) => {
      const btn = page.getByTestId('form-cancel')
      await expect(btn).toHaveText('button.peruuta')
      await btn.click()
      // expect to be back in instruction list view
      await expect(page.getByTestId('create-ohje-button')).toBeVisible()
    })

    test(`can cancel ${exam} updating instruction`, async ({ page }) => {
      const form = new InstructionFormModel(page, exam)

      const instructionId = await form.createInstruction(
        'submit',
        'form.notification.ohjeen-tallennus.julkaisu-onnistui'
      )
      await form.navigateToInstructionExamPage()
      const instructionCard = page.getByTestId(`instruction-${instructionId}`)

      await expect(instructionCard).toBeVisible()
      await page.getByTestId(`instruction-${instructionId}-edit`).click()

      const btn = page.getByTestId('form-cancel')
      await expect(btn).toHaveText('button.peruuta')
      await btn.click()
    })
  })
})
