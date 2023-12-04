import { Page } from '@playwright/test'

export class ContentModel {
  constructor(
    readonly page: Page,
    readonly header = page.getByTestId('assignment-header'),
    readonly editButton = page.getByTestId('edit-content-btn'),
    readonly publishState = page.getByTestId('publish-state'),
    readonly contentFi = page.getByTestId('editor-content-fi-0'),
    readonly contentSv = page.getByTestId('editor-content-fi-0'),
    readonly returnButton = page.getByTestId('return')
  ) {}
}
