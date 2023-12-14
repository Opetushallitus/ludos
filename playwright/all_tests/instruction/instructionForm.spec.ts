import { expect, Page, test } from '@playwright/test'
import { assertUpdatedInstruction, initializeInstructionTest, updateAttachments } from './instructionHelpers'
import {
  assertSuccessNotification,
  FormAction,
  koodiLabel,
  loginTestGroup,
  Role,
  setTeachingLanguage
} from '../../helpers'
import { Exam, KoodistoName, TeachingLanguage } from 'web/src/types'
import { InstructionFormModel } from '../../models/InstructionFormModel'

async function updateInstruction(
  form: InstructionFormModel,
  instructionId: number,
  action: FormAction,
  previousName: string,
  expectedNotification: string
) {
  const { page, exam } = form

  await navigateToInstructionExamPage(page, exam)

  await setTeachingLanguage(page, TeachingLanguage.sv)
  const instructionCard = page.getByTestId(`instruction-${instructionId}`)

  await expect(instructionCard).toBeVisible()

  if (exam === Exam.LD) {
    await expect(instructionCard.getByTestId('card-title')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9')
    )
  } else {
    await expect(instructionCard.getByTestId('card-title')).toHaveText(previousName)
  }

  await page.getByTestId(`instruction-${instructionId}-edit`).click()
  await form.fillInstructionForm({
    nameFi: 'Testi ohje muokattu',
    nameSv: 'Testuppgifter redigerade',
    contentFi: 'Testi sisältö muokattu',
    contentSv: 'Testinstruktioner redigerade'
  })

  if (action === 'submit') {
    await page.getByTestId('form-submit').click()
  } else {
    await page.getByTestId('form-draft').click()
  }

  await assertSuccessNotification(page, expectedNotification)

  await assertUpdatedInstruction(page)
}

async function navigateToInstructionExamPage(page: Page, exam: Exam) {
  await page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
  await page.getByTestId('tab-ohjeet').click()
}

async function createAndUpdatePublishedInstruction(page: Page, exam: Exam) {
  const form = new InstructionFormModel(page, exam)

  const instructionId = await form.createInstruction('submit', 'form.notification.ohjeen-tallennus.julkaisu-onnistui')
  await updateInstruction(form, instructionId, 'submit', 'Testuppgifter', 'form.notification.ohjeen-tallennus.onnistui')
  await updateAttachments(page)
  await updateInstruction(
    form,
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

  await updateInstruction(form, instructionId, 'draft', 'Testuppgifter', 'form.notification.ohjeen-tallennus.onnistui')
  await updateInstruction(
    form,
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
      await navigateToInstructionExamPage(page, exam)
      const instructionCard = page.getByTestId(`instruction-${instructionId}`)

      await expect(instructionCard).toBeVisible()
      await page.getByTestId(`instruction-${instructionId}-edit`).click()

      const btn = page.getByTestId('form-cancel')
      await expect(btn).toHaveText('button.peruuta')
      await btn.click()
    })
  })
})
