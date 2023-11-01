import { expect, Page, test } from '@playwright/test'
import {
  assertCreatedInstruction,
  assertUpdatedInstruction,
  fillInstructionForm,
  updateAttachments
} from './instructionHelpers'
import {
  assertSuccessNotification,
  examsLowerCase,
  FormAction,
  loginTestGroup,
  Role,
  setTeachingLanguage
} from '../../helpers'
import path from 'path'
import { TeachingLanguage } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

async function createInstruction(page: Page, action: FormAction, expectedNotification: string) {
  await fillInstructionForm({
    page,
    nameFi: 'Testi ohje',
    nameSv: 'Testuppgifter',
    contentFi: 'Testi sisältö',
    contentSv: 'Testa innehåll',
    shortDescriptionFi: 'Testi lyhyt kuvaus',
    shortDescriptionSv: 'Testa kort beskrivning',
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
  await assertCreatedInstruction(page, action)

  return instructionToUpdate
}

async function updateInstruction(
  page: Page,
  exam: string,
  instructionId: number,
  action: FormAction,
  previousName: string,
  expectedNotification: string
) {
  await navigateToInstructionExamPage(page, exam)

  await setTeachingLanguage(page, TeachingLanguage.sv)
  const instructionCard = page.getByTestId(`instruction-${instructionId}`)

  await expect(instructionCard).toBeVisible()
  await expect(instructionCard.getByTestId('instruction-name')).toHaveText(previousName)

  await page.getByTestId(`instruction-${instructionId}-edit`).click()
  await fillInstructionForm({
    page,
    nameFi: 'Testi ohje muokattu',
    nameSv: 'Testuppgifter redigerade',
    contentFi: 'Testi sisältö muokattu',
    contentSv: 'Testinstruktioner redigerade'
  })

  if (action === 'submit') {
    await page.getByTestId('form-update-submit').click()
  } else {
    await page.getByTestId('form-update-draft').click()
  }

  await assertSuccessNotification(page, expectedNotification)

  await assertUpdatedInstruction(page)
}

async function navigateToInstructionExamPage(page: Page, exam: string) {
  await page.getByTestId(`nav-link-${exam}`).click()
  await page.getByTestId('tab-ohjeet').click()
}

async function createAndUpdatePublishedInstruction(page: Page, exam: string) {
  const instructionId = await createInstruction(page, 'submit', 'form.notification.ohjeen-tallennus.julkaisu-onnistui')
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

async function createAndUpdateDraftInstruction(page: Page, exam: string) {
  const instructionId = await createInstruction(page, 'draft', 'form.notification.ohjeen-tallennus.luonnos-onnistui')

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
async function deleteInstruction(page: Page, instructionId: number, exam: string) {
  await page.getByTestId('edit-content-btn').click()

  await page.getByTestId('form-delete').click()
  await page.getByTestId('modal-button-delete').last().click()

  await assertSuccessNotification(page, 'ohjeen-poisto.onnistui')

  // expect not to find the deleted certificate from list
  await expect(page.getByTestId(`instruction-${instructionId}`)).toBeHidden()

  await page.goto(`/${exam}/ohjeet/${instructionId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

examsLowerCase.forEach((exam) => {
  test.describe(`${exam} instruction form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam}`).click()
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
        nameFi: 'Testi ohje'
      })

      await page.getByTestId('form-submit').click()
      await assertSuccessNotification(page, 'ohjeen-tallennus.julkaisu-onnistui')

      await page.getByTestId('edit-content-btn').click()

      const file = path.resolve(__dirname, '../../../server/src/main/resources/fixtures/this-will-fail.txt')
      await page.getByTestId('file-input-fi').setInputFiles(file)

      const errorMessage = await page.getByTestId('file-upload-error-message').innerText()
      expect(errorMessage).toContain('form.tiedoston-lataus-epaonnistui')
    })
  })
})
