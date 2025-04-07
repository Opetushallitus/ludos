import { expect, Page } from '@playwright/test'
import { ContentModel } from './ContentModel'
import { ContentType, Exam } from 'web/src/types'
import { PrintContentModel } from './PrintContentModel'

export class AssignmentContentModel extends ContentModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly tulostusnakyma = page.getByTestId('tulostusnakyma'),
    readonly metadata = page.getByTestId('assignment-metadata')
  ) {
    super(page, exam, ContentType.ASSIGNMENT)
  }

  async openPrintViewInNewWindow(): Promise<PrintContentModel> {
    const newPagePromise: Promise<Page> = this.page.waitForEvent('popup')
    await this.tulostusnakyma.click()
    const openedPage = await newPagePromise
    await openedPage.bringToFront()

    const printContentModel = new PrintContentModel(openedPage, this.exam)
    await expect(printContentModel.container).toBeVisible()

    return printContentModel
  }

  assertAttachments(attachmentNames: string[]) {
    expect(attachmentNames).toHaveLength(0) // Koetehtävissä ei voi olla liitteitä
  }
}
