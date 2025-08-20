import { expect, Page } from '@playwright/test'
import {
  AttachmentDtoOut,
  ContentType,
  Exam,
  InstructionDtoOut,
  KoodistoName,
  Language,
  PublishState
} from 'web/src/types'
import { assertInstructionContentPage, getFileBlob } from '../examHelpers/instructionHelpers'
import {
  assertSuccessNotification,
  createFilePathToFixtures,
  FormAction,
  fetchWithSession,
  koodiLabel,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../helpers'
import { ContentListModel } from './ContentListModel'
import { EditorModel } from './EditorModel'
import { FormModel } from './FormModel'
import { InstructionContentModel } from './InstructionContentModel'

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

export class InstructionFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentFiEditor = new EditorModel(page, page.getByTestId('editor-content-fi')),
    readonly contentSvEditor = new EditorModel(page, page.getByTestId('editor-content-sv')),
    readonly createNewInstructionButton = page.getByTestId('create-ohje-button'),
    readonly shortDescriptionFi = page.getByTestId('shortDescriptionFi'),
    readonly shortDescriptionSv = page.getByTestId('shortDescriptionSv'),
    readonly content = new InstructionContentModel(page, exam),
    readonly formData: InstructionFormData = {
      nameFi: 'Testi ohje',
      nameSv: 'Testuppgift',
      contentFi: 'Testi sisältö',
      contentSv: 'Test innehåll',
      aineKoodiArvo: '9',
      shortDescriptionFi: 'Testi lyhyt kuvaus',
      shortDescriptionSv: 'Test kort beskrivning',
      attachmentNameFi: 'Testi ohje 1.pdf',
      attachmentNameSv: 'Testuppgift 2.pdf'
    }
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
    await this.nameFi.fill(this.formData.nameFi)
  }

  async createInstruction(action: FormAction, expectedNotification: string) {
    await this.assertNavigationNoBlockOnCleanForm()
    await this.fillInstructionForm(this.formData)

    await this.assertNavigationBlockOnDirtyForm()

    const clickResponse = this.page.waitForResponse(
      (response) => response.url().includes('/api/instruction') && response.ok()
    )

    if (action === 'submit') {
      void this.submitButton.click()
    } else {
      void this.draftButton.click()
    }

    const response = await clickResponse
    const responseData = (await response.json()) as InstructionDtoOut
    const instructionToUpdate = responseData.id

    await assertSuccessNotification(this.page, expectedNotification)
    await assertInstructionContentPage(this, action, this.formData)

    return instructionToUpdate
  }

  async fillInstructionForm(formData: Partial<InstructionFormData>) {
    await expect(this.heading).toBeVisible()

    if (this.exam === Exam.LD && formData?.aineKoodiArvo) {
      await setSingleSelectDropdownOption(this.page, 'aineKoodiArvo', formData.aineKoodiArvo)
    }

    if (formData?.nameFi) {
      await this.nameFi.fill(formData.nameFi)
    }

    if (formData?.contentFi) {
      await this.contentFiEditor.content.fill(formData.contentFi)
    }
    if (this.exam !== Exam.LD && formData?.shortDescriptionFi) {
      await this.shortDescriptionFi.fill(formData.shortDescriptionFi)
    }

    const files = ['fixture1.pdf', 'fixture2.pdf']
    const filePaths = files.map((file) => createFilePathToFixtures(file))

    for (const filePath of filePaths) {
      await this.attachmentInputFi.setInputFiles(filePath)
    }

    if (formData?.nameFi) {
      for (const [index] of files.entries()) {
        await this.page.getByTestId(`attachment-name-input-${index}-FI`).fill(`${formData.nameFi} ${index + 1}`)
      }

      // Tarkistetaan että input kentissä näkyy teksti oikein. OPHLUDOS-183
      for (const [index] of files.entries()) {
        await expect(this.page.getByTestId(`attachment-name-input-${index}-FI`)).toHaveValue(
          `${formData.nameFi} ${index + 1}`
        )
      }
    }

    await this.tabSv.click()
    if (formData?.nameSv) {
      await this.nameSv.fill(formData.nameSv)
    }
    if (formData?.contentSv) {
      await this.contentSvEditor.content.fill(formData.contentSv)
    }
    if (this.exam !== Exam.LD && formData?.shortDescriptionSv) {
      await this.shortDescriptionSv.fill(formData.shortDescriptionSv)
    }

    for (const filePath of filePaths) {
      await this.attachmentInputSv.setInputFiles(filePath)
    }

    if (formData?.nameSv) {
      for (const [index] of files.entries()) {
        await this.page.getByTestId(`attachment-name-input-${index}-SV`).fill(`${formData.nameSv} ${index + 1}`)
      }
    }
  }

  async updateInstruction(instructionId: number, action: FormAction, expectedNotification: string) {
    await this.navigateToInstructionExamPage()

    await setTeachingLanguage(this.page, Language.SV)
    const instructionCard = this.page.getByTestId(`instruction-${instructionId}`)

    await expect(instructionCard).toBeVisible()

    if (this.exam === Exam.LD) {
      await expect(instructionCard.getByTestId('card-title')).toHaveText(
        await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9', Language.SV)
      )
    } else {
      await expect(instructionCard.getByTestId('card-title')).toHaveText(this.formData.nameSv)
    }

    await this.page.getByTestId(`instruction-${instructionId}-edit`).click()
    await expect(this.heading).toBeVisible()

    await this.assertNavigationNoBlockOnCleanForm()

    const updateFormData: Partial<InstructionFormData> = {
      ...this.formData,
      nameFi: `${this.formData.nameFi} muokattu`,
      nameSv: `${this.formData.nameSv} redigerade`,
      contentFi: 'Testi sisältö muokattu',
      contentSv: 'Testinstruktioner redigerade'
    }

    await this.fillInstructionForm(updateFormData)

    if (action === 'submit') {
      await this.assertNavigationBlockOnDirtyForm()
      await this.submitButton.click()
    } else {
      await this.draftButton.click()
    }

    await assertSuccessNotification(this.page, expectedNotification)
    await assertInstructionContentPage(this, action, updateFormData)
  }

  async changeState(instructionId: number, action: FormAction, expectedNotification: string) {
    await this.navigateToInstructionExamPage()

    await this.page.getByTestId(`instruction-${instructionId}-edit`).click()

    if (action === 'submit') {
      await this.assertNavigationNoBlockOnCleanForm()
      await this.submitButton.click()
    } else {
      await this.draftButton.click()
    }

    await expect(this.page.getByTestId('assignment-header')).toBeVisible()
    await assertSuccessNotification(this.page, expectedNotification)
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
          language: currentAttachment.language.toUpperCase(),
          fileKey: currentAttachment.fileKey
        })
      )
    })

    newAttachmentFixtureFilenames.forEach((fixtureFilename) => {
      this.addAttachmentPartToFormData(formData, 'new-attachments', fixtureFilename)
    })

    const response = await fetchWithSession(this.page.context(), `${baseURL}/api/instruction/${id}`, 'PUT', formData)
    return parseInt(await response.text())
  }

  async createInstructionApiCall(baseURL: string, attachmentFixtureFilenames: string[]) {
    const formData = new FormData()

    const instructionPart = new Blob(
      [JSON.stringify({ ...this.formData, exam: this.exam, publishState: PublishState.Published })],
      {
        type: 'application/json'
      }
    )
    formData.append('instruction', instructionPart)

    attachmentFixtureFilenames.forEach((attachmentFixtureFilename) => {
      this.addAttachmentPartToFormData(formData, 'attachments', attachmentFixtureFilename)
    })

    const response = await fetchWithSession(this.page.context(), `${baseURL}/api/instruction`, 'POST', formData)
    return (await response.json()) as InstructionDtoOut
  }

  async getInstructionApiCall(baseURL: string, id: number) {
    const response = await fetchWithSession(this.page.context(), `${baseURL}/api/instruction/${this.exam}/${id}`, 'GET')
    return (await response.json()) as InstructionDtoOut
  }
}
