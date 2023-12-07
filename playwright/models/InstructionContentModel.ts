import { Page } from '@playwright/test'
import { ContentModel } from './ContentModel'

export class InstructionContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly contentFi = page.getByTestId('editor-content-fi-0')
  ) {
    super(page)
  }
}
