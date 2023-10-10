import { expect, Page, test } from '@playwright/test'
import { Exam, loginTestGroup, Role, setMultiSelectDropdownOptions } from '../../helpers'
import { checkListAfterFiltering, filterTestAssignmentName } from './assignmentHelpers'
import { TeachingLanguage } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Assignment filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seedAssignmentsForFilterTest')
  })

  const sukoUnfilteredStartPageCheck = async (page: Page) =>
    await checkListAfterFiltering(
      page,
      Exam.Suko,
      [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4]
    )

  test('suko', async ({ page }) => {
    await page.goto('/suko/koetehtavat')

    await expect(page.getByTestId('page-button-1')).toBeVisible()
    await expect(page.getByTestId('page-button-2')).toBeVisible()

    await sukoUnfilteredStartPageCheck(page)

    // assert pagination button states
    await expect(page.getByTestId('previous-page')).toBeDisabled()
    await page.getByTestId('next-page').click()
    await expect(page.getByTestId('next-page')).toBeDisabled()
    await expect(page.getByTestId('previous-page')).toBeEnabled()

    await checkListAfterFiltering(page, Exam.Suko, [3, 2, 1, 0])

    await page.getByTestId('page-button-1').click()

    await sukoUnfilteredStartPageCheck(page)

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1', 'VKA1.RA'])
    await setMultiSelectDropdownOptions(page, 'contentTypeFilter', ['003']) // keskustelu
    await setMultiSelectDropdownOptions(page, 'aiheFilter', ['013']) // pohjoismaat
    await checkListAfterFiltering(page, Exam.Suko, [20, 8])

    // await page.locator('#tavoitetaitotaso-input').fill('b1')
    // await page.getByTestId('tavoitetaitotaso').click()
    // B1.1
    // await page.getByTestId('tavoitetaitotaso-option-0007').click()
    // // B1.2
    // await page.getByTestId('tavoitetaitotaso-option-0008').click()

    // refresh page to make sure filters stay
    await page.reload()
    await checkListAfterFiltering(page, Exam.Suko, [20, 8])

    await page.getByRole('link', { name: filterTestAssignmentName(20, TeachingLanguage.fi, Exam.Suko) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(
      filterTestAssignmentName(20, TeachingLanguage.fi, Exam.Suko)
    )
    await page.getByTestId('return').click()

    // make sure filters stay when returning from an assignment
    await checkListAfterFiltering(page, Exam.Suko, [20, 8])

    // remove selections from assignmentType filter
    await page.getByTestId('contentTypeFilter-reset-selected-options').click()
    await checkListAfterFiltering(page, Exam.Suko, [20, 19, 8])
  })

  test('suko oppimaaras', async ({ page }) => {
    await page.goto('/suko/koetehtavat')

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1'])
    await checkListAfterFiltering(page, Exam.Suko, [21, 20, 19, 10, 9, 8])

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1.RA'])
    await checkListAfterFiltering(page, Exam.Suko, [19, 8])

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKB1'])
    await checkListAfterFiltering(page, Exam.Suko, [18, 7])

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKB1.IA'])
    await checkListAfterFiltering(page, Exam.Suko, [18, 7])
  })

  test('ld', async ({ page }) => {
    await page.goto('/ld/koetehtavat')

    await setMultiSelectDropdownOptions(page, 'lukuvuosiFilter', ['20202021'])
    await setMultiSelectDropdownOptions(page, 'aineFilter', ['6']) // musiikki
    await checkListAfterFiltering(page, Exam.Ld, [5])

    await page.getByRole('link', { name: filterTestAssignmentName(5, TeachingLanguage.fi, Exam.Ld) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(
      filterTestAssignmentName(5, TeachingLanguage.fi, Exam.Ld)
    )
    await page.getByTestId('return').click()
  })

  test('puhvi', async ({ page }) => {
    await page.goto('/puhvi/koetehtavat')

    await setMultiSelectDropdownOptions(page, 'lukuvuosiFilter', ['20242025'])
    await setMultiSelectDropdownOptions(page, 'tehtavatyyppiPuhviFilter', ['002']) // esiintymistaidot
    await checkListAfterFiltering(page, Exam.Puhvi, [18, 8])

    await page.getByRole('link', { name: filterTestAssignmentName(8, TeachingLanguage.fi, Exam.Puhvi) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(
      filterTestAssignmentName(8, TeachingLanguage.fi, Exam.Puhvi)
    )
  })
})
