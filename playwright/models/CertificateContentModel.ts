import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class CertificateContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam
  ) {
    super(page, exam, ContentType.todistukset)
  }

  async assertAttachments(attachmentNames: string[]) {
    expect(attachmentNames).toHaveLength(1)
    const attachment = await this.page.getByTestId(attachmentNames[0]).allTextContents()
    expect(attachment[0]).toContain(attachmentNames[0])
  }
}
