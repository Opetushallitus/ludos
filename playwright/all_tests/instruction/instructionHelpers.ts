import { expect, Page } from '@playwright/test'
import { assertSuccessNotification, createFilePathToFixtures, FormAction, setTeachingLanguage } from '../../helpers'
import { Exam, TeachingLanguage } from 'web/src/types'
import { InstructionFormModel } from '../../models/InstructionFormModel'
import { LayoutModel } from '../../models/LayoutModel'
import * as fs from 'fs'

export function getFileBlob(filename: string) {
  const filePath = createFilePathToFixtures(filename)
  const fileContents = fs.readFileSync(filePath)
  return new Blob([fileContents], { type: 'application/pdf' })
}

export async function initializeInstructionTest(page: Page, exam: Exam) {
  await page.goto('/')
  await new LayoutModel(page).showLocalizationKeys()
  await new InstructionFormModel(page, exam).gotoNew()
}

export type InstructionFormData = {
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  aineKoodiArvo: string
  shortDescriptionFi: string
  shortDescriptionSv: string
  attachmentNameFi: string
  attachmentNameSv: string
}

export const instructionFormData: InstructionFormData = {
  nameFi: 'Testi ohje',
  nameSv: 'Testuppgifter',
  contentFi: 'Testi sisältö',
  contentSv: 'Testa innehåll',
  aineKoodiArvo: '9',
  shortDescriptionFi: 'Testi lyhyt kuvaus',
  shortDescriptionSv: 'Testa kort beskrivning',
  attachmentNameFi: 'Testi liite',
  attachmentNameSv: 'Testa bilaga'
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

export async function assertCreatedInstruction(form: InstructionFormModel, action: FormAction) {
  const { page, exam, formHeader } = form
  const {
    nameFi,
    contentFi,
    shortDescriptionFi,
    attachmentNameFi,
    nameSv,
    contentSv,
    shortDescriptionSv,
    attachmentNameSv
  } = instructionFormData

  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')

  // aineKoodiArvon tsekkaus puuttuu?

  await expect(formHeader).toHaveText(nameFi)
  // check short description
  exam !== Exam.LD && (await expect(page.getByText(shortDescriptionFi, { exact: true })).toBeVisible())
  // check content
  await expect(page.getByText(contentFi, { exact: true })).toBeVisible()
  // check files
  await expect(page.getByRole('link', { name: `${attachmentNameFi} 1 open_in_new` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${attachmentNameFi} 2 open_in_new` })).toBeVisible()

  // change language and check that everything is correct
  await setTeachingLanguage(page, TeachingLanguage.sv)
  await expect(formHeader).toHaveText(nameSv)
  exam !== Exam.LD && (await expect(page.getByText(shortDescriptionSv, { exact: true })).toBeVisible())
  await expect(page.getByText(contentSv, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: `${attachmentNameSv} 1 open_in_new` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${attachmentNameSv} 2 open_in_new` })).toBeVisible()
}

export async function assertUpdatedInstruction(page: Page, newNameFi: string, newNameSv: string) {
  await setTeachingLanguage(page, TeachingLanguage.fi)
  const updatedInstructionHeader = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeader).toHaveText(newNameFi)
  await setTeachingLanguage(page, TeachingLanguage.sv)
  const updatedInstructionHeaderSv = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeaderSv).toHaveText(newNameSv)
}
