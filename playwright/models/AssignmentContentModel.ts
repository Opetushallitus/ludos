import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class AssignmentContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly downloadPdfButtonFi = page.getByTestId('pdf-download-button-fi'),
    readonly downloadPdfButtonSv = page.getByTestId('pdf-download-button-sv')
  ) {
    super(page, exam, ContentType.ASSIGNMENT)
  }

  async assertAttachments(attachmentNames: string[]): Promise<void> {
    expect(attachmentNames).toHaveLength(0) // Koetehtävissä ei voi olla liitteitä
  }
}
