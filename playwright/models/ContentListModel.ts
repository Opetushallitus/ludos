import { Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'

export class ContentListModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentType: ContentType // Maybe we should extend this by ContentType instead?
  ) {}

  async goto() {
    await this.page.getByTestId(`nav-link-${this.exam.toLowerCase()}`).click()
    await this.page.getByTestId(`tab-${this.contentType}`).click()
  }
}
