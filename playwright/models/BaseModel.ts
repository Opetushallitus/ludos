import { Page } from '@playwright/test'
import { Exam } from 'web/src/types'
import { LayoutModel } from './LayoutModel'

export class BaseModel {
  constructor(readonly page: Page, readonly exam: Exam) {}

  async showKeys() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' })
    await new LayoutModel(this.page).showLocalizationKeys()
  }
}
