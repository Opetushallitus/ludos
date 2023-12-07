import { Page } from '@playwright/test'

export class ContentModel {
  constructor(
    readonly page: Page,
    readonly header = page.getByTestId('assignment-header'),
    readonly editButton = page.getByTestId('edit-content-btn'),
    readonly publishState = page.getByTestId('publish-state')
  ) {}
}
