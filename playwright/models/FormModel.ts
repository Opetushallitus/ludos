import { Page } from '@playwright/test'
import { Exam } from 'web/src/types'

export class FormModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly formHeader = page.getByTestId('assignment-header'),
    readonly heading = page.getByTestId('heading'),
    readonly nameFi = page.getByTestId('nameFi'),
    readonly nameSv = page.getByTestId('nameSv'),
    readonly submitButton = page.getByTestId('form-submit'),
    readonly draftButton = page.getByTestId('form-draft')
  ) {}
}
