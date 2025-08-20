import { expect, Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { ContentModel } from './ContentModel'

export class CertificateContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam
  ) {
    super(page, exam, ContentType.CERTIFICATE)
  }

  async assertAttachments(attachmentNames: string[]) {
    expect(attachmentNames).toHaveLength(1)
    const attachment = await this.page.getByTestId(attachmentNames[0]).allTextContents()
    expect(attachment[0]).toContain(attachmentNames[0])
  }
}
