import { Page } from '@playwright/test'
import { Exam } from 'web/src/types'

export class PrintContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly container = page.getByTestId('print-content'),
    readonly header = container.getByTestId('assignment-header'),
    readonly metadata = container.getByTestId('assignment-metadata')
  ) {
  }
}
