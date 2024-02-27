import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class InstructionContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam
  ) {
    super(page, exam, ContentType.INSTRUCTION)
  }

  async assertAttachments(expectedAttachmentNames: string[]) {
    const expectedAttachmentNamesSorted = expectedAttachmentNames.slice().sort()
    const attachmentLinkContentsSorted = (await this.page.getByTestId('attachment-link').allTextContents()).sort()
    expect(attachmentLinkContentsSorted).toEqual(expectedAttachmentNamesSorted.map((n) => `${n}open_in_new`))
  }
}
