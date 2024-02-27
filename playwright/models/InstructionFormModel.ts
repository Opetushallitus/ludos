import { expect, Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { AttachmentDtoOut, ContentType, Exam, KoodistoName, PublishState, TeachingLanguage } from 'web/src/types'
import {
  assertCreatedInstruction,
  assertUpdatedInstruction,
  getFileBlob,
  InstructionFormData,
  instructionFormData
} from '../examHelpers/instructionHelpers'
import { EditorModel } from './EditorModel'
import {
  assertSuccessNotification,
  createFilePathToFixtures,
  fetchWithSession,
  FormAction,
  koodiLabel,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../helpers'
import { ContentListModel } from './ContentListModel'

export class InstructionFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentFiEditor = new EditorModel(page, page.getByTestId('editor-content-fi')),
    readonly contentSvEditor = new EditorModel(page, page.getByTestId('editor-content-sv')),
    readonly createNewInstructionButton = page.getByTestId('create-ohje-button'),
    readonly shortDescriptionFi = page.getByTestId('shortDescriptionFi'),
    readonly shortDescriptionSv = page.getByTestId('shortDescriptionSv')
  ) {
    super(page, exam)
  }

  async navigateToInstructionExamPage() {
    await new ContentListModel(this.page, this.exam, ContentType.INSTRUCTION).goto()
  }

  async gotoNew() {
    await this.navigateToInstructionExamPage()
    await this.createNewInstructionButton.click()
  }

  async fillMinimalInstructionForm() {
    await this.nameFi.fill(instructionFormData.nameFi)
  }

  async createInstruction(action: FormAction, expectedNotification: string) {
    await this.assertNavigationNoBlockOnCleanForm()
    await this.fillInstructionForm(instructionFormData)

    await this.assertNavigationBlockOnDirtyForm()

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

  async fillInstructionForm(formData: Partial<InstructionFormData>) {
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

    await expect(this.heading).toBeVisible()

    if (this.exam === Exam.LD && aineKoodiArvo) {
      await setSingleSelectDropdownOption(this.page, 'aineKoodiArvo', aineKoodiArvo)
    }

    if (nameFi) {
      await this.nameFi.fill(nameFi)
    }
    if (contentFi) {
      await this.contentFiEditor.content.fill(contentFi)
    }
    if (this.exam !== Exam.LD && shortDescriptionFi) {
      await this.shortDescriptionFi.fill(shortDescriptionFi)
    }

    const files = ['fixture1.pdf', 'fixture2.pdf']

    const filePaths = files.map((file) => createFilePathToFixtures(file))

    if (attachmentNameFi) {
      for (const filePath of filePaths) {
        await this.attachmentInputFi.setInputFiles(filePath)
      }
      for (const [index] of files.entries()) {
        await this.page.getByTestId(`attachment-name-input-${index}-FI`).fill(`${attachmentNameFi} ${index + 1}`)
      }
    }

    const hasSvFields = nameSv || contentSv || shortDescriptionSv || attachmentNameSv

    if (hasSvFields) {
      await this.tabSv.click()
      if (nameSv) {
        await this.nameSv.fill(nameSv)
      }
      if (contentSv) {
        await this.contentSvEditor.content.fill(contentSv)
      }
      if (this.exam !== Exam.LD && shortDescriptionSv) {
        await this.shortDescriptionSv.fill(shortDescriptionSv)
      }

      if (attachmentNameSv) {
        for (const filePath of filePaths) {
          await this.attachmentInputSv.setInputFiles(filePath)
        }
        for (const [index] of files.entries()) {
          await this.page.getByTestId(`attachment-name-input-${index}-SV`).fill(`${attachmentNameSv} ${index + 1}`)
        }
      }
    }
  }

  async updateInstruction(
    instructionId: number,
    action: FormAction,
    previousName: string,
    expectedNotification: string
  ) {
    await this.navigateToInstructionExamPage()

    await setTeachingLanguage(this.page, TeachingLanguage.SV)
    const instructionCard = this.page.getByTestId(`instruction-${instructionId}`)

    await expect(instructionCard).toBeVisible()

    if (this.exam === Exam.LD) {
      await expect(instructionCard.getByTestId('card-title')).toHaveText(
        await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9', TeachingLanguage.SV)
      )
    } else {
      await expect(instructionCard.getByTestId('card-title')).toHaveText(previousName)
    }

    await this.page.getByTestId(`instruction-${instructionId}-edit`).click()
    await expect(this.heading).toBeVisible()

    await this.assertNavigationNoBlockOnCleanForm()

    await this.fillInstructionForm({
      nameFi: 'Testi ohje muokattu',
      nameSv: `${previousName} redigerade`,
      contentFi: 'Testi sisältö muokattu',
      contentSv: 'Testinstruktioner redigerade'
    })

    if (action === 'submit') {
      await this.assertNavigationBlockOnDirtyForm()
      await this.submitButton.click()
    } else {
      await this.draftButton.click()
    }

    await assertSuccessNotification(this.page, expectedNotification)

    await assertUpdatedInstruction(this.page, 'Testi ohje muokattu', `${previousName} redigerade`)
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
