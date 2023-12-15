import { BrowserContext, expect, Page } from '@playwright/test'
import {
  assertSuccessNotification,
  createFilePathToFixtures,
  FormAction,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'
import { Exam, PublishState, TeachingLanguage } from 'web/src/types'
import { InstructionFormModel } from '../../models/InstructionFormModel'
import { LayoutModel } from '../../models/LayoutModel'
import * as fs from 'fs'

function getFileBlob(filename: string) {
  const filePath = createFilePathToFixtures(filename)
  const fileContents = fs.readFileSync(filePath)
  return new Blob([fileContents], { type: 'application/pdf' }) // Adjust the MIME type accordingly
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

export async function createInstruction(exam: Exam, context: BrowserContext, baseURL: string) {
  const formData = new FormData()

  const instructionPart = new Blob(
    [JSON.stringify({ ...instructionFormData, exam, publishState: PublishState.Published })],
    {
      type: 'application/json'
    }
  )
  formData.append('instruction', instructionPart)

  const attachments = ['fixture1.pdf'].map((filename, index) => {
    const fileBlob = getFileBlob(filename)
    const metadata = {
      name: `Testi liite${index}`,
      language: 'FI'
    }

    return { fileBlob, metadata }
  })

  attachments.forEach((attachment, index) => {
    formData.append('attachments', attachment.fileBlob, `attachment${index}.pdf`)
    formData.append(
      'attachments-metadata',
      new Blob([JSON.stringify(attachment.metadata)], { type: 'application/json' })
    )
  })

  const storageState = await context.storageState()
  const sessionCookie = storageState.cookies.find((cookie) => cookie.name === 'SESSION')
  if (!sessionCookie) {
    throw new Error('Session cookie not found from storagestate, did you authenticate?')
  }
  const result = await fetch(`${baseURL}/api/instruction`, {
    method: 'POST',
    body: formData,
    headers: {
      Cookie: `SESSION=${sessionCookie?.value}`
    }
  })

  if (!result.ok) {
    throw new Error(await result.text())
  }

  return await result.json()
}

export async function fillInstructionForm({
  form,
  ...formData
}: { form: InstructionFormModel } & Partial<InstructionFormData>) {
  const { page, exam } = form
  const {
    nameFi,
    nameSv,
    contentFi,
    contentSv,
    aineKoodiArvo,
    shortDescriptionFi,
    shortDescriptionSv,
    attachmentNameFi,
    attachmentNameSv
  } = formData

  await expect(page.getByTestId('heading')).toBeVisible()

  if (exam === Exam.LD && aineKoodiArvo) {
    await setSingleSelectDropdownOption(page, 'aineKoodiArvo', aineKoodiArvo)
  }

  if (nameFi) {
    await form.nameFi.fill(nameFi)
  }
  if (contentFi) {
    await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentFi)
  }
  if (exam !== Exam.LD && shortDescriptionFi) {
    await page.getByTestId('shortDescriptionFi').fill(shortDescriptionFi)
  }

  const files = ['fixture1.pdf', 'fixture2.pdf']

  const filePaths = files.map((file) => createFilePathToFixtures(file))

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
      await form.nameSv.fill(nameSv)
    }
    if (contentSv) {
      await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentSv)
    }
    if (exam !== Exam.LD && shortDescriptionSv) {
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

export async function assertUpdatedInstruction(page: Page) {
  await setTeachingLanguage(page, TeachingLanguage.fi)
  const updatedInstructionHeader = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeader).toHaveText('Testi ohje muokattu')
  await setTeachingLanguage(page, TeachingLanguage.sv)
  const updatedInstructionHeaderSv = page.getByTestId('assignment-header')
  await expect(updatedInstructionHeaderSv).toHaveText('Testuppgifter redigerade')
}
