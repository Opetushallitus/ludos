import { Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { Exam } from 'web/src/types'
import { ContentType } from '../helpers'

export class AssignmentContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly downloadPdfButtonFi = page.getByTestId('pdf-download-button-fi'),
    readonly downloadPdfButtonSv = page.getByTestId('pdf-download-button-sv')
  ) {
    super(page)
  }
  async gotoAssignmentContentPage(id: string) {
    await this.page.goto(`/${this.exam.toLowerCase()}/${ContentType.koetehtavat}/${id}`)
  }
}
