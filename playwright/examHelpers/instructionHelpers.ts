import { expect, Page } from '@playwright/test'
import { assertSuccessNotification, createFilePathToFixtures, FormAction, setTeachingLanguage } from '../helpers'
import { Exam, TeachingLanguage } from 'web/src/types'
import { InstructionFormModel } from '../models/InstructionFormModel'
import { LayoutModel } from '../models/LayoutModel'
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
  nameSv: 'Testuppgift',
  contentFi: 'Testi sisältö',
  contentSv: 'Test innehåll',
  aineKoodiArvo: '9',
  shortDescriptionFi: 'Testi lyhyt kuvaus',
  shortDescriptionSv: 'Test kort beskrivning',
  attachmentNameFi: 'Testi liite',
  attachmentNameSv: 'Test bilaga'
}

export async function updateAttachments(form: InstructionFormModel) {
  await form.editContentButton.first().click()
  // delete one finnish file
  await form.page.getByTestId('delete-attachment-icon-0').first().click()
  await form.modalDeleteButton.first().click()
  // rename other finnish file
  await form.page.getByTestId('attachment-name-input-0-FI').first().fill('Testi liite muokattu')

  await form.submitButton.click()
  await assertSuccessNotification(form.page, 'form.notification.ohjeen-tallennus.onnistui')

  await setTeachingLanguage(form.page, TeachingLanguage.FI)
  await expect(form.page.getByRole('link', { name: 'Testi liite 1 open_in_new' })).toBeHidden()
  await expect(form.page.getByRole('link', { name: 'Testi liite muokattu' })).toBeVisible()
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
  await setTeachingLanguage(page, TeachingLanguage.SV)
  await expect(formHeader).toHaveText(nameSv)
  exam !== Exam.LD && (await expect(page.getByText(shortDescriptionSv, { exact: true })).toBeVisible())
  await expect(page.getByText(contentSv, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: `${attachmentNameSv} 1 open_in_new` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${attachmentNameSv} 2 open_in_new` })).toBeVisible()
}

export async function assertUpdatedInstruction(page: Page, newNameFi: string, newNameSv: string) {
  await setTeachingLanguage(page, TeachingLanguage.FI)
  const updatedInstructionHeader = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeader).toHaveText(newNameFi)
  await setTeachingLanguage(page, TeachingLanguage.SV)
  const updatedInstructionHeaderSv = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeaderSv).toHaveText(newNameSv)
}
