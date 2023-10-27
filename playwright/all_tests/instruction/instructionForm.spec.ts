import { expect, Page, test } from '@playwright/test'
import {
  assertCreatedInstruction,
  assertUpdatedInstruction,
  fillInstructionForm,
  updateAttachments
} from './instructionHelpers'
import {
  assertSuccessNotification,
  FormAction,
  koodiLabel,
  loginTestGroup,
  Role,
  setTeachingLanguage
} from '../../helpers'
import path from 'path'
import { Exam, KoodistoName, TeachingLanguage } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

async function createInstruction(page: Page, exam: Exam, action: FormAction, expectedNotification: string) {
  await fillInstructionForm({
    page,
    nameFi: 'Testi ohje',
    nameSv: 'Testuppgifter',
    contentFi: 'Testi sisältö',
    contentSv: 'Testa innehåll',
    aineKoodiArvo: exam === Exam.LD ? '9' : undefined,
    shortDescriptionFi: exam !== Exam.LD ? 'Testi lyhyt kuvaus' : undefined,
    shortDescriptionSv: exam !== Exam.LD ? 'Testa kort beskrivning' : undefined,
    attachmentNameFi: 'Testi liite',
    attachmentNameSv: 'Testa bilaga'
  })

  if (action === 'submit') {
    void page.getByTestId('form-submit').click()
  } else {
    void page.getByTestId('form-draft').click()
  }

  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/instruction') && response.ok()
  )
  const responseData = await response.json()
  const instructionToUpdate = responseData.id

  await assertSuccessNotification(page, expectedNotification)
  await assertCreatedInstruction(page, exam, action)

  return instructionToUpdate
}

async function updateInstruction(
  page: Page,
  exam: Exam,
  instructionId: number,
  action: FormAction,
  previousName: string,
  expectedNotification: string
) {
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
  await fillInstructionForm({
    page,
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
  const instructionId = await createInstruction(
    page,
    exam,
    'submit',
    'form.notification.ohjeen-tallennus.julkaisu-onnistui'
  )
  await updateInstruction(
    page,
    exam,
    instructionId,
    'submit',
    'Testuppgifter',
    'form.notification.ohjeen-tallennus.onnistui'
  )
  await updateAttachments(page)
  await updateInstruction(
    page,
    exam,
    instructionId,
    'draft',
    'Testuppgifter redigerade',
    'form.notification.ohjeen-tallennus.palautettu-luonnostilaan'
  )

  await deleteInstruction(page, instructionId, exam)
}

async function createAndUpdateDraftInstruction(page: Page, exam: Exam) {
  const instructionId = await createInstruction(
    page,
    exam,
    'draft',
    'form.notification.ohjeen-tallennus.luonnos-onnistui'
  )

  await updateInstruction(
    page,
    exam,
    instructionId,
    'draft',
    'Testuppgifter',
    'form.notification.ohjeen-tallennus.onnistui'
  )
  await updateInstruction(
    page,
    exam,
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

Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
      await page.getByTestId('tab-ohjeet').click()
      await page.getByTestId('create-ohje-button').click()
    })

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
      const instructionId = await createInstruction(
        page,
        exam,
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

    test(`${exam} failing of attachment upload is handled correctly`, async ({ page }) => {
      await fillInstructionForm({
        page,
        nameFi: 'Liitteen poisto epäonnistumis testi',
        aineKoodiArvo: exam === Exam.LD ? '9' : undefined
      })

      await page.getByTestId('form-submit').click()
      await assertSuccessNotification(page, 'form.notification.ohjeen-tallennus.julkaisu-onnistui')

      await page.getByTestId('edit-content-btn').click()

      const file = path.resolve(__dirname, '../../../server/src/main/resources/fixtures/this-will-fail.txt')
      await page.getByTestId('file-input-fi').setInputFiles(file)

      const errorMessage = await page.getByTestId('file-upload-error-message').innerText()
      expect(errorMessage).toContain('form.tiedoston-lataus-epaonnistui')
    })
  })
})
