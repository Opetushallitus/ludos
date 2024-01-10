import { Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'

export class InstructionContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly downloadPdfButtonFi = page.getByTestId('pdf-download-button-fi'),
    readonly downloadPdfButtonSv = page.getByTestId('pdf-download-button-sv')
  ) {
    super(page)
  }

  async gotoInstructionContentPage(exam: Exam, id: string) {
    await this.page.goto(`/${exam.toLowerCase()}/${ContentType.ohjeet}/${id}`)
  }
}
