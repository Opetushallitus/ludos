import { Page } from '@playwright/test'
import { FormModel } from './FormModel'
import { ContentType, Exam, PublishState } from 'web/src/types'
import { fetchWithSession, FormAction } from '../helpers'
import { ContentListModel } from './ContentListModel'
import { AnyCertificateFormType, AttachmentFormType } from 'web/src/components/forms/schemas/certificateSchema'
import { getFileBlob } from '../examHelpers/instructionHelpers'

export class CertificateFormModel extends FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
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
    },
    readonly descriptionFi = page.getByTestId('descriptionFi'),
    readonly descriptionSv = page.getByTestId('descriptionSv')
  ) {
    super(page, exam)
  }

  async gotoNew() {
    await new ContentListModel(this.page, this.exam, ContentType.todistukset).goto()
    await this.createNewCertificateButton.click()
  }

  async submitCertificate(action: FormAction) {
    if (action === 'submit') {
      void this.submitButton.click()
    } else {
      void this.draftButton.click()
    }
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

  createFormData = (action: FormAction): AnyCertificateFormType => ({
    exam: this.exam,
    publishState: PublishState.Published,
    nameFi: this.certificateNameByAction(action),
    nameSv: `${this.certificateNameByAction(action)} sv`,
    descriptionFi: 'Todistuksen kuvaus FI',
    descriptionSv: 'Todistuksen kuvaus SV',
    attachmentFi: this.attachment1,
    attachmentSv: this.attachment1,
    aineKoodiArvo: '9'
  })

  updateCertificateInputs = (action: FormAction): AnyCertificateFormType => ({
    exam: this.exam,
    publishState: PublishState.Published,
    nameFi: `${this.certificateNameByAction(action)} updated`,
    nameSv: `${this.certificateNameByAction(action)} sv updated`,
    descriptionFi: 'Todistuksen kuvaus FI updated',
    descriptionSv: 'Todistuksen kuvaus SV updated',
    attachmentFi: this.attachment2,
    attachmentSv: this.attachment2,
    aineKoodiArvo: '9'
  })

  private prepareCertificateFormData(certificateIn: AnyCertificateFormType, fileBlobName: string) {
    const formData = new FormData()

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
    certificateIn: AnyCertificateFormType,
    attachmentFixtureFilename: string
  ) {
    const formData = this.prepareCertificateFormData(certificateIn, attachmentFixtureFilename)
    return await (await fetchWithSession(this.page.context(), `${baseURL}/api/certificate`, formData, 'POST')).json()
  }

  async updateCertificateApiCall(
    baseURL: string,
    id: number,
    certificateIn: AnyCertificateFormType,
    attachmentFixtureFilename: string
  ) {
    const formData = this.prepareCertificateFormData(certificateIn, attachmentFixtureFilename)
    return await (
      await fetchWithSession(this.page.context(), `${baseURL}/api/certificate/${id}`, formData, 'PUT')
    ).json()
  }
}
