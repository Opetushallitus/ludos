import { expect, Page } from '@playwright/test'
import path from 'path'
import {
  assertSuccessNotification,
  FormAction,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'
import { Exam, TeachingLanguage } from 'web/src/types'

export async function fillInstructionForm({
  page,
  contentFi,
  contentSv,
  nameFi,
  nameSv,
  aineKoodiArvo,
  shortDescriptionFi,
  shortDescriptionSv,
  attachmentNameFi,
  attachmentNameSv
}: {
  page: Page
  nameFi?: string
  nameSv?: string
  contentFi?: string
  contentSv?: string
  aineKoodiArvo?: string
  shortDescriptionFi?: string
  shortDescriptionSv?: string
  attachmentNameFi?: string
  attachmentNameSv?: string
}) {
  await expect(page.getByTestId('heading')).toBeVisible()

  if (aineKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'aineKoodiArvo', '9')
  }

  if (nameFi) {
    await page.getByTestId('nameFi').fill(nameFi)
  }
  if (contentFi) {
    await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentFi)
  }
  if (shortDescriptionFi) {
    await page.getByTestId('shortDescriptionFi').fill(shortDescriptionFi)
  }

  const files = ['fixture1.pdf', 'fixture2.pdf']

  const filePaths = files.map((file) => path.resolve(__dirname, `../../../server/src/main/resources/fixtures/${file}`))

  if (attachmentNameFi) {
    for (const filePath of filePaths) {
      await page.locator('#fileInput-fi').setInputFiles(filePath)
    }
    for (const [index] of files.entries()) {
      await page.getByTestId(`attachment-name-input-${index}-fi`).fill(`${attachmentNameFi} ${index + 1}`)
    }
  }

  const hasSvFields = nameSv || contentSv || shortDescriptionSv || attachmentNameSv

  if (hasSvFields) {
    await page.getByTestId('tab-sv').click()
    if (nameSv) {
      await page.getByTestId('nameSv').fill(nameSv)
    }
    if (contentSv) {
      await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentSv)
    }
    if (shortDescriptionSv) {
      await page.getByTestId('shortDescriptionSv').fill(shortDescriptionSv)
    }

    if (attachmentNameSv) {
      for (const filePath of filePaths) {
        await page.locator('#fileInput-sv').setInputFiles(filePath)
      }
      for (const [index] of files.entries()) {
        await page.getByTestId(`attachment-name-input-${index}-sv`).fill(`${attachmentNameSv} ${index + 1}`)
      }
    }
  }
}

export async function updateAttachments(page: Page) {
  await page.getByTestId('edit-content-btn').first().click()
  // delete one finnish file
  await page.getByTestId('delete-attachment-icon-0').first().click()
  await page.getByTestId('modal-button-delete').first().click()
  // rename other finnish file
  await page.getByTestId('attachment-name-input-0-fi').first().fill('Testi liite muokattu')

  await page.getByTestId('form-submit').click()
  await assertSuccessNotification(page, 'form.notification.ohjeen-tallennus.onnistui')

  await setTeachingLanguage(page, TeachingLanguage.fi)
  await expect(page.getByRole('link', { name: 'Testi liite 1 open_in_new' })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Testi liite muokattu' })).toBeVisible()
}

export async function assertCreatedInstruction(page: Page, exam: Exam, action: FormAction) {
  const header = page.getByTestId('assignment-header')

  if (action === 'submit') {
    await expect(page.getByTestId('publish-state')).toHaveText('state.julkaistu')
  } else {
    await expect(page.getByTestId('publish-state')).toHaveText('state.luonnos')
  }

  await expect(header).toHaveText('Testi ohje')
  // check short description
  exam !== Exam.LD && (await expect(page.getByText('Testi lyhyt kuvaus', { exact: true })).toBeVisible())
  // check content
  await expect(page.getByText('Testi sisältö', { exact: true })).toBeVisible()
  // check files
  await expect(page.getByRole('link', { name: 'Testi liite 1 open_in_new' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Testi liite 2 open_in_new' })).toBeVisible()

  // change language and check that everything is correct
  await setTeachingLanguage(page, TeachingLanguage.sv)
  await expect(header).toHaveText('Testuppgifter')
  exam !== Exam.LD && (await expect(page.getByText('Testa kort beskrivning', { exact: true })).toBeVisible())
  await expect(page.getByText('Testa innehåll', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Testa bilaga 1 open_in_new' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Testa bilaga 2 open_in_new' })).toBeVisible()
}

export async function assertUpdatedInstruction(page: Page) {
  await setTeachingLanguage(page, TeachingLanguage.fi)
  const updatedInstructionHeader = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeader).toHaveText('Testi ohje muokattu')
  await setTeachingLanguage(page, TeachingLanguage.sv)
  const updatedInstructionHeaderSv = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeaderSv).toHaveText('Testuppgifter redigerade')
}
