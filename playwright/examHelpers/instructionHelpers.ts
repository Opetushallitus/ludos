import { expect, Page } from '@playwright/test'
import * as fs from 'fs'
import { Exam, KoodistoName, Language } from 'web/src/types'
import {
  assertSuccessNotification,
  createFilePathToFixtures,
  FormAction,
  koodiLabel,
  setTeachingLanguage
} from '../helpers'
import { InstructionFormData, InstructionFormModel } from '../models/InstructionFormModel'
import { LayoutModel } from '../models/LayoutModel'

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

export async function updateAttachments(form: InstructionFormModel) {
  await form.editContentButton.first().click()
  // delete one finnish file
  await form.page.getByTestId('delete-attachment-icon-0').first().click()
  await form.modalDeleteButton.first().click()
  // rename other finnish file
  await form.page.getByTestId('attachment-name-input-0-FI').first().fill('Testi liite uusi nimi')

  await form.submitButton.click()

  await assertSuccessNotification(form.page, 'form.notification.ohjeen-tallennus.julkaisu-onnistui')

  await setTeachingLanguage(form.page, Language.FI)
  await expect(form.page.getByRole('link', { name: 'Testi liite 1' })).toBeHidden()
  await expect(form.page.getByRole('link', { name: 'Testi liite uusi nimi' })).toBeVisible()
}

export async function assertInstructionContentPage(
  form: InstructionFormModel,
  action: FormAction,
  formData: Partial<InstructionFormData>
) {
  const { page, exam } = form

  await expect(form.content.publishState).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')

  await setTeachingLanguage(page, Language.FI)

  if (exam === Exam.LD) {
    await expect(form.content.aineKoodiArvo).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9', Language.FI)
    )
  }

  if (formData.nameFi) {
    const updatedInstructionHeader = page.getByTestId('assignment-header')
    await expect(updatedInstructionHeader).toHaveText(formData.nameFi)
  }

  if (formData.shortDescriptionFi && exam !== Exam.LD) {
    await expect(page.getByText(formData.shortDescriptionFi, { exact: true })).toBeVisible()
  }

  if (formData.contentFi) {
    await expect(page.getByText(formData.contentFi, { exact: true })).toBeVisible()
  }

  await expect(page.getByRole('link', { name: `${formData.nameFi} 1` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${formData.nameFi} 2` })).toBeVisible()

  await setTeachingLanguage(page, Language.SV)

  if (exam === Exam.LD) {
    await expect(form.content.aineKoodiArvo).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9', Language.SV)
    )
  }

  if (formData.nameSv) {
    const updatedInstructionHeaderSv = page.getByTestId('assignment-header')
    await expect(updatedInstructionHeaderSv).toHaveText(formData.nameSv)
  }

  if (exam !== Exam.LD && formData.shortDescriptionSv) {
    await expect(page.getByText(formData.shortDescriptionSv, { exact: true })).toBeVisible()
  }

  if (formData.contentSv) {
    await expect(page.getByText(formData.contentSv, { exact: true })).toBeVisible()
  }

  await expect(page.getByRole('link', { name: `${formData.nameSv} 1` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${formData.nameSv} 2` })).toBeVisible()
}
