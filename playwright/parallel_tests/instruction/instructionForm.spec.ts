import { expect, test } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { initializeInstructionTest, updateAttachments } from '../../examHelpers/instructionHelpers'
import { assertSuccessNotification, loginTestGroup, Role } from '../../helpers'
import { InstructionFormModel } from '../../models/InstructionFormModel'

async function createAndUpdatePublishedInstruction(form: InstructionFormModel) {
  const instructionId = await form.createInstruction('submit', 'form.notification.ohjeen-tallennus.julkaisu-onnistui')
  await form.updateInstruction(instructionId, 'submit', 'form.notification.ohjeen-tallennus.onnistui')
  await form.changeState(instructionId, 'draft', 'form.notification.ohjeen-tallennus.palautettu-luonnostilaan')
  await updateAttachments(form)

  await deleteInstruction(form, instructionId)
}

async function createAndUpdateDraftInstruction(form: InstructionFormModel) {
  const instructionId = await form.createInstruction('draft', 'form.notification.ohjeen-tallennus.luonnos-onnistui')

  await form.updateInstruction(instructionId, 'draft', 'form.notification.ohjeen-tallennus.onnistui')
  await form.changeState(instructionId, 'submit', 'form.notification.ohjeen-tallennus.julkaisu-onnistui')

  await deleteInstruction(form, instructionId)
}

async function deleteInstruction(form: InstructionFormModel, instructionId: number) {
  await form.editContentButton.click()

  await form.deleteButton.click()
  await form.modalDeleteButton.last().click()

  await expect(form.page.getByTestId('card-list')).toBeVisible()
  await assertSuccessNotification(form.page, 'ohjeen-poisto.onnistui')
  // expect not to find the deleted certificate from a list
  await expect(form.page.getByTestId(`instruction-${instructionId}`)).toBeHidden()

  await form.goToContentPage(ContentType.INSTRUCTION, instructionId)
  await expect(form.page.getByText('404', { exact: true })).toBeVisible()
}

loginTestGroup(test, Role.YLLAPITAJA)

Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction form tests`, () => {
    test.beforeEach(async ({ page }) => await initializeInstructionTest(page, exam))

    test(`can create, update and delete a new published ${exam} instruction`, async ({ page }) =>
      await createAndUpdatePublishedInstruction(new InstructionFormModel(page, exam)))

    test(`can create, update and delete a new draft ${exam} instruction`, async ({ page }) =>
      await createAndUpdateDraftInstruction(new InstructionFormModel(page, exam)))

    test(`can cancel ${exam} creating instruction`, async ({ page }) => {
      const form = new InstructionFormModel(page, exam)

      await form.cancelButton.click()

      // expect to be back in instruction list view
      await expect(form.createNewInstructionButton).toBeVisible()
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

      await form.cancelButton.click()
    })

    test('form validations work', async ({ page }) => {
      const form = new InstructionFormModel(page, exam)

      await form.submitButton.click()
      await expect(form.formErrorMsgList).toBeVisible()

      await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgNameFi, () =>
        form.nameFi.fill(form.formData.nameFi)
      )
      await form.nameFi.clear()

      await form.tabSv.click()

      await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgNameSv, () =>
        form.nameSv.fill(form.formData.nameSv)
      )
    })
  })
})
