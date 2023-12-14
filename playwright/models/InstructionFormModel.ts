import { expect, Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { AttachmentDtoOut, ContentType, Exam, PublishState } from 'web/src/types'
import {
  assertCreatedInstruction,
  getFileBlob,
  InstructionFormData,
  instructionFormData
} from '../all_tests/instruction/instructionHelpers'
import { EditorModel } from './EditorModel'
import {
  assertSuccessNotification,
  createFilePathToFixtures,
  fetchWithSession,
  FormAction,
  setSingleSelectDropdownOption
} from '../helpers'
import { ContentListModel } from './ContentListModel'

export class InstructionFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentFiEditor = new EditorModel(page, page.getByTestId('editor-content-fi')),
    readonly createNewInstructionButton = page.getByTestId('create-ohje-button')
  ) {
    super(page, exam)
  }

  async gotoNew() {
    await new ContentListModel(this.page, this.exam, ContentType.ohjeet).goto()
    await this.createNewInstructionButton.click()
  }

  async fillMinimalInstructionForm() {
    await this.nameFi.fill(instructionFormData.nameFi)
  }

  async createInstruction(action: FormAction, expectedNotification: string) {
    await this.fillInstructionForm(instructionFormData)

    if (action === 'submit') {
      void this.submitButton.click()
    } else {
      void this.draftButton.click()
    }

    const response = await this.page.waitForResponse(
      (response) => response.url().includes('/api/instruction') && response.ok()
    )
    const responseData = await response.json()
    const instructionToUpdate = responseData.id

    await assertSuccessNotification(this.page, expectedNotification)
    await assertCreatedInstruction(this, action)

    return instructionToUpdate
  }

  async fillInstructionForm({ ...formData }: Partial<InstructionFormData>) {
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

    await expect(this.page.getByTestId('heading')).toBeVisible()

    if (this.exam === Exam.LD && aineKoodiArvo) {
      await setSingleSelectDropdownOption(this.page, 'aineKoodiArvo', aineKoodiArvo)
    }

    if (nameFi) {
      await this.nameFi.fill(nameFi)
    }
    if (contentFi) {
      await this.page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentFi)
    }
    if (this.exam !== Exam.LD && shortDescriptionFi) {
      await this.page.getByTestId('shortDescriptionFi').fill(shortDescriptionFi)
    }

    const files = ['fixture1.pdf', 'fixture2.pdf']

    const filePaths = files.map((file) => createFilePathToFixtures(file))

    if (attachmentNameFi) {
      for (const filePath of filePaths) {
        await this.page.getByTestId('file-input-fi').setInputFiles(filePath)
      }
      for (const [index] of files.entries()) {
        await this.page.getByTestId(`attachment-name-input-${index}-fi`).fill(`${attachmentNameFi} ${index + 1}`)
      }
    }

    const hasSvFields = nameSv || contentSv || shortDescriptionSv || attachmentNameSv

    if (hasSvFields) {
      await this.page.getByTestId('tab-sv').click()
      if (nameSv) {
        await this.nameSv.fill(nameSv)
      }
      if (contentSv) {
        await this.page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentSv)
      }
      if (this.exam !== Exam.LD && shortDescriptionSv) {
        await this.page.getByTestId('shortDescriptionSv').fill(shortDescriptionSv)
      }

      if (attachmentNameSv) {
        for (const filePath of filePaths) {
          await this.page.getByTestId('file-input-sv').setInputFiles(filePath)
        }
        for (const [index] of files.entries()) {
          await this.page.getByTestId(`attachment-name-input-${index}-sv`).fill(`${attachmentNameSv} ${index + 1}`)
        }
      }
    }
  }

  private addAttachmentPartToFormData(form: FormData, partName: string, attachmentName: string) {
    const attachment = {
      fileBlob: getFileBlob(attachmentName),
      metadata: {
        name: attachmentName,
        language: 'FI'
      }
    }

    form.append(partName, attachment.fileBlob)
    form.append(
      `${partName}-metadata`,
      new Blob([JSON.stringify(attachment.metadata), attachmentName], { type: 'application/json' })
    )
  }

  async updateInstructionApiCall(
    baseURL: string,
    id: number,
    body: string,
    currentAttachments: AttachmentDtoOut[],
    newAttachmentFixtureFilenames: string[]
  ) {
    const formData = new FormData()

    const instructionPart = new Blob([body], { type: 'application/json' })
    formData.append('instruction', instructionPart)

    currentAttachments.forEach((currentAttachment) => {
      formData.append(
        'attachments-metadata',
        JSON.stringify({
          name: currentAttachment.name,
          language: currentAttachment.language!.toUpperCase(),
          fileKey: currentAttachment.fileKey
        })
      )
    })

    newAttachmentFixtureFilenames.forEach((fixtureFilename) => {
      this.addAttachmentPartToFormData(formData, 'new-attachments', fixtureFilename)
    })

    return await (
      await fetchWithSession(this.page.context(), `${baseURL}/api/instruction/${id}`, formData, 'PUT')
    ).json()
  }

  async createInstructionApiCall(baseURL: string, attachmentFixtureFilenames: string[]) {
    const formData = new FormData()

    const instructionPart = new Blob(
      [JSON.stringify({ ...instructionFormData, exam: this.exam, publishState: PublishState.Published })],
      {
        type: 'application/json'
      }
    )
    formData.append('instruction', instructionPart)

    attachmentFixtureFilenames.forEach((attachmentFixtureFilename) => {
      this.addAttachmentPartToFormData(formData, 'attachments', attachmentFixtureFilename)
    })

    return await (await fetchWithSession(this.page.context(), `${baseURL}/api/instruction`, formData, 'POST')).json()
  }
}
