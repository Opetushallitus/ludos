import { Locator, Page } from '@playwright/test'
import { ContentType } from 'web/src/types'

export class ContentTypeTabModel {
  constructor(readonly page: Page) {}

  tab(contentType: ContentType): Locator {
    return this.page.getByTestId(`tab-${contentType.toLowerCase()}`)
  }
}
