import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class InstructionContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly downloadPdfButtonFi = page.getByTestId('pdf-download-button-fi'),
    readonly downloadPdfButtonSv = page.getByTestId('pdf-download-button-sv')
  ) {
    super(page, exam, ContentType.ohjeet)
  }

  async assertAttachments(expectedAttachmentNames: string[]) {
    const expectedAttachmentNamesSorted = expectedAttachmentNames.slice().sort()
    const attachmentLinkContentsSorted = (await this.page.getByTestId('attachment-link').allTextContents()).sort()
    expect(attachmentLinkContentsSorted).toEqual(expectedAttachmentNamesSorted.map((n) => `${n}open_in_new`))
  }
}
