import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class AssignmentContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly downloadPdfButtonFi = page.getByTestId('pdf-download-button-FI'),
    readonly downloadPdfButtonSv = page.getByTestId('pdf-download-button-SV'),
    readonly metadata = page.getByTestId('assignment-metadata')
  ) {
    super(page, exam, ContentType.ASSIGNMENT)
  }

  assertAttachments(attachmentNames: string[]) {
    expect(attachmentNames).toHaveLength(0) // Koetehtävissä ei voi olla liitteitä
  }
}
