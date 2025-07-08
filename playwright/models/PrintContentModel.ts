import { Page } from '@playwright/test'
import { Exam } from 'web/src/types'

export class PrintContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly container = page.getByTestId('print-content'),
    readonly header = container.getByTestId('assignment-header'),
    readonly metadata = container.getByTestId('assignment-metadata'),
    readonly oppimaara = container.getByTestId('suko-oppimaara'),
    readonly tehtavatyyppi = container.getByTestId('suko-tehtavatyyppi'),
    readonly aihe = container.getByTestId('suko-aihe'),
    readonly laajaAlainenOsaaminen = container.getByTestId('laajaalainenosaaminen'),
    readonly instructionFi = container.getByTestId('editor-instruction-FI-0'),
    readonly contentFi = container.getByTestId('editor-content-FI-0'),
    readonly printButton = container.locator('#print-button')
  ) {}
}
