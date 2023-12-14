import { expect, Page } from '@playwright/test'
import { FormModel } from './FormModel'
import {
  ContentType,
  Exam,
  LdCertificateDtoOut,
  PublishState,
  PuhviCertificateDtoOut,
  SukoCertificateDtoOut
} from 'web/src/types'
import { EditorModel } from './EditorModel'
import { fetchWithSession, FormAction } from '../helpers'
import { ContentListModel } from './ContentListModel'
import { fillCertificateForm } from '../all_tests/certificate/certificateHelpers'
import { AttachmentFormType, CertificateFormType } from 'web/src/components/forms/schemas/certificateSchema'
import { getFileBlob } from '../all_tests/instruction/instructionHelpers'

export class CertificateFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentFiEditor = new EditorModel(page, page.getByTestId('editor-content-fi')),
    readonly createNewCertificateButton = page.getByTestId('create-todistus-button'),
    readonly attachment1: AttachmentFormType = {
      name: 'fixture1.pdf',
      size: 323,
      fileName: 'fixture1.pdf',
      fileKey: '123-123'
    },
    readonly attachment2: AttachmentFormType = {
      name: 'fixture2.pdf',
      size: 331,
      fileName: 'fixture2.pdf',
      fileKey: '123-123'
    }
  ) {
    super(page, exam)
  }

  async gotoNew() {
    await new ContentListModel(this.page, this.exam, ContentType.todistukset).goto()
    await this.createNewCertificateButton.click()
  }

  private certificateNameByAction(action: FormAction): string {
    switch (action) {
      case 'submit':
        return 'Testi todistus'
      case 'draft':
        return 'Testi todistus draft'
      case 'cancel':
        return 'Testi todistus cancel'
      case 'delete':
        return 'Testi todistus delete'
    }
  }

  createCertificateInputs = (action: FormAction): CertificateFormType => ({
    exam: this.exam,
    nameFi: this.certificateNameByAction(action),
    nameSv: `${this.certificateNameByAction(action)} sv`,
    descriptionFi: 'Todistuksen kuvaus FI',
    descriptionSv: 'Todistuksen kuvaus SV',
    attachmentFi: this.attachment1,
    attachmentSv: this.attachment1,
    aineKoodiArvo: '9'
  })

  updateCertificateInputs = (action: FormAction): CertificateFormType => ({
    exam: this.exam,
    nameFi: `${this.certificateNameByAction(action)} updated`,
    nameSv: `${this.certificateNameByAction(action)} sv updated`,
    descriptionFi: 'Todistuksen kuvaus FI updated',
    descriptionSv: 'Todistuksen kuvaus SV updated',
    attachmentFi: this.attachment2,
    attachmentSv: this.attachment2,
    aineKoodiArvo: '9'
  })

  async createCertificate(
    action: FormAction
  ): Promise<SukoCertificateDtoOut | LdCertificateDtoOut | PuhviCertificateDtoOut> {
    const certificateIn = this.createCertificateInputs(action)
    await fillCertificateForm(this.page, this.exam, certificateIn)
    void this.submitButton.click()

    const response = await this.page.waitForResponse(
      (response) => response.url().includes('/api/certificate') && response.ok()
    )

    return response.json()
  }

  async updateCertificate(input: CertificateFormType) {
    await this.editContentButton.click()

    await expect(this.heading).toBeVisible()

    await fillCertificateForm(this.page, this.exam, input)

    await this.submitButton.click()
  }

  private prepareCertificateFormData(certificateIn: CertificateFormType, fileBlobName: string) {
    const formData = new FormData()

    if (this.exam !== Exam.LD) {
      delete certificateIn.aineKoodiArvo
    }

    if (this.exam === Exam.SUKO) {
      certificateIn.nameSv = ''
      certificateIn.descriptionSv = ''
    }

    const certificatePart = new Blob(
      [JSON.stringify({ ...certificateIn, exam: this.exam, publishState: PublishState.Published })],
      { type: 'application/json' }
    )
    formData.append('certificate', certificatePart)

    const fileBlob = getFileBlob(fileBlobName)
    formData.append('attachmentFi', fileBlob, fileBlobName)
    formData.append('attachmentSv', fileBlob, fileBlobName)

    return formData
  }
  async createCertificateApiCall(
    baseURL: string,
    certificateIn: CertificateFormType,
    attachmentFixtureFilename: string
  ) {
    const formData = this.prepareCertificateFormData(certificateIn, attachmentFixtureFilename)
    return await (await fetchWithSession(this.page.context(), `${baseURL}/api/certificate`, formData, 'POST')).json()
  }

  async updateCertificateApiCall(
    baseURL: string,
    id: number,
    certificateIn: CertificateFormType,
    attachmentFixtureFilename: string
  ) {
    const formData = this.prepareCertificateFormData(certificateIn, attachmentFixtureFilename)
    return await (
      await fetchWithSession(this.page.context(), `${baseURL}/api/certificate/${id}`, formData, 'PUT')
    ).json()
  }
}
