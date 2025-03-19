import { expect, test } from '@playwright/test'
import { loginTestGroup, resetDatabase, Role, setMultiSelectDropdownOptions } from '../../helpers'
import { filterTestAssignmentName } from '../../examHelpers/assignmentHelpers'
import { Exam, Language } from 'web/src/types'
import { AssignmentContentListModel } from '../../models/AssignmentContentListModel'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe.configure({ mode: 'serial' })

test.describe('Assignment filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
    await page.goto('/api/test/seedAssignmentsForFilterTest')
  })

  const sukoUnfilteredStartPageCheck =
    (contentList: AssignmentContentListModel) =>
    async (order: 'asc' | 'desc' = 'desc') => {
      const arr =
        order === 'desc'
          ? Array.from({ length: 20 }, (_, i) => 24 - i) // from 25 to 5
          : Array.from({ length: 20 }, (_, i) => i + 1) // from 1 to 20

      return await contentList.checkListAfterFiltering(arr)
    }

  test('suko', async ({ page }) => {
    const contentList = new AssignmentContentListModel(page, Exam.SUKO)
    await contentList.goto()

    await expect(contentList.pageButton1).toBeVisible()
    await expect(contentList.pageButton2).toBeVisible()

    const assertStartPage = sukoUnfilteredStartPageCheck(contentList)

    // assert ordering asc and desc works
    await contentList.setOrder('asc')
    await assertStartPage('asc')
    await contentList.setOrder('desc')
    await assertStartPage()
    // assert pagination button states
    await expect(contentList.previousPageButton).toBeDisabled()
    await contentList.nextPageButton.click()
    await expect(contentList.nextPageButton).toBeDisabled()
    await expect(contentList.previousPageButton).toBeEnabled()

    await contentList.checkListAfterFiltering([4, 3, 2, 1])

    await contentList.pageButton1.click()

    await assertStartPage()

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1'])
    await setMultiSelectDropdownOptions(page, 'contentTypeFilter', ['003']) // keskustelu
    await setMultiSelectDropdownOptions(page, 'aiheFilter', ['013']) // pohjoismaat

    await contentList.checkListAfterFiltering([20, 8])
    // refresh page to make sure filters stay
    await page.reload()
    await contentList.checkListAfterFiltering([20, 8])

    await page.getByRole('link', { name: filterTestAssignmentName(20, Language.FI, Exam.SUKO) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(filterTestAssignmentName(20, Language.FI, Exam.SUKO))
    await page.getByTestId('return').click()

    // make sure filters stay when returning from an assignment
    await contentList.checkListAfterFiltering([20, 8])
    // remove selections from assignmentType filter
    await page.getByTestId('contentTypeFilter-reset-selected-options').click()
    await contentList.checkListAfterFiltering([20, 19, 8])
  })

  test('suko oppimaaras', async ({ page }) => {
    const contentList = new AssignmentContentListModel(page, Exam.SUKO)
    await contentList.goto()

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1'])
    await contentList.checkListAfterFiltering([20, 19, 9, 8])

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1.RA'])
    await contentList.checkListAfterFiltering([19, 8])

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1.SA'])
    await contentList.checkListAfterFiltering([20, 9])
  })

  test('ld', async ({ page }) => {
    const contentList = new AssignmentContentListModel(page, Exam.LD)
    await contentList.goto()

    await setMultiSelectDropdownOptions(page, 'lukuvuosiFilter', ['20202021'])
    await setMultiSelectDropdownOptions(page, 'aineFilter', ['6']) // musiikki
    await contentList.checkListAfterFiltering([5])

    await page.getByRole('link', { name: filterTestAssignmentName(5, Language.FI, Exam.LD) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(filterTestAssignmentName(5, Language.FI, Exam.LD))
  })

  test('puhvi', async ({ page }) => {
    const contentList = new AssignmentContentListModel(page, Exam.PUHVI)
    await contentList.goto()

    await setMultiSelectDropdownOptions(page, 'lukuvuosiFilter', ['20242025'])
    await setMultiSelectDropdownOptions(page, 'tehtavatyyppiPuhviFilter', ['002']) // esiintymistaidot
    await contentList.checkListAfterFiltering([18, 8])

    await page.getByRole('link', { name: filterTestAssignmentName(8, Language.FI, Exam.PUHVI) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(filterTestAssignmentName(8, Language.FI, Exam.PUHVI))
  })
})
