import { expect, Page } from '@playwright/test'
import { ContentType, Exam } from 'web/src/types'
import { setSingleSelectDropdownOption } from '../helpers'
import { ContentTypeTabModel } from './ContentTypeTabModel'

export class ContentListModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly contentType: ContentType, // Maybe we should extend this by ContentType instead?
    readonly contentTypeTabs = new ContentTypeTabModel(page)
  ) {}

  async goto() {
    await this.page.getByTestId(`nav-link-${this.exam.toLowerCase()}`).click()
    await expect(this.page.getByTestId(`page-heading-${this.exam.toLowerCase()}`)).toBeVisible()
    await this.page.getByTestId(`tab-${this.contentType}`).click()
    await expect(this.contentTypeTabs.tab(this.contentType)).toHaveAttribute('aria-current')
  }

  async setOrder(direction: 'asc' | 'desc') {
    await setSingleSelectDropdownOption(this.page, 'orderFilter', direction)
    await this.page.waitForURL(new RegExp(`.*jarjesta=${direction}.*`))
  }
}
