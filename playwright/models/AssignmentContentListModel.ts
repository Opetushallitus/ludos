import { expect, Page } from '@playwright/test'
import { ContentType, Exam, Language } from 'web/src/types'
import { filterTestAssignmentName } from '../examHelpers/assignmentHelpers'
import { setSingleSelectDropdownOption } from '../helpers'
import { ContentListModel } from './ContentListModel'

export class AssignmentContentListModel extends ContentListModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly pageButton1 = page.getByTestId('page-button-1'),
    readonly pageButton2 = page.getByTestId('page-button-2'),
    readonly previousPageButton = page.getByTestId('previous-page'),
    readonly nextPageButton = page.getByTestId('next-page')
  ) {
    super(page, exam, ContentType.ASSIGNMENT)
  }

  async setOrder(direction: 'asc' | 'desc') {
    await setSingleSelectDropdownOption(this.page, 'orderFilter', direction)
  }

  async checkListAfterFiltering(expectedAssignmentTitleNumbers: number[]) {

    const expectedNames = expectedAssignmentTitleNumbers.map((number) => filterTestAssignmentName(number, Language.FI, this.exam))

    const getAllNames = async () => {
      return await this.page.getByTestId('card-list').locator('li').getByTestId('card-title').allInnerTexts()
    }

    await expect.poll(getAllNames).toEqual(expect.arrayContaining(expectedNames))
  }
}
