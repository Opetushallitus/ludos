import { expect, test } from '@playwright/test'
import { Exam, loginTestGroup, Role } from '../../helpers'
import { checkListAfterFiltering, filterTestAssignmentName } from './assignmentHelpers'
import { setMultiSelectDropdownOptions } from '../../helpers'
import { TeachingLanguage } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Assignment filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seedAssignmentsForFilterTest')
  })

  test('suko', async ({ page }) => {
    await page.goto('/suko/koetehtavat')

    await checkListAfterFiltering(page, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], Exam.Suko)

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1', 'TKFIA1', 'TKFIB1', 'TKFIB3'])
    await setMultiSelectDropdownOptions(page, 'contentTypeFilter', ['003']) // keskustelu
    await setMultiSelectDropdownOptions(page, 'aiheFilter', ['013']) // pohjoismaat
    await checkListAfterFiltering(page, [8, 2], Exam.Suko)

    // await page.locator('#tavoitetaitotaso-input').fill('b1')
    // await page.getByTestId('tavoitetaitotaso').click()
    // B1.1
    // await page.getByTestId('tavoitetaitotaso-option-0007').click()
    // B1.2
    // await page.getByTestId('tavoitetaitotaso-option-0008').click()

    // refresh page to make sure filters stay
    await page.reload()
    await checkListAfterFiltering(page, [8, 2], Exam.Suko)

    await page.getByRole('link', { name: filterTestAssignmentName(2, TeachingLanguage.fi, Exam.Suko) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(
      filterTestAssignmentName(2, TeachingLanguage.fi, Exam.Suko)
    )
    await page.getByTestId('return').click()

    // make sure filters stay when returning from an assignment
    await checkListAfterFiltering(page, [8, 2], Exam.Suko)

    // remove selections from assignmentType filter
    await page.getByTestId('contentTypeFilter-reset-selected-options').click()
    await checkListAfterFiltering(page, [8, 2, 1], Exam.Suko)
  })

  test('suko oppimaaras', async ({ page }) => {
    await page.goto('/suko/koetehtavat')

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1'])
    await checkListAfterFiltering(page, [10, 9, 8], Exam.Suko)

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKA1.RA'])
    await checkListAfterFiltering(page, [8], Exam.Suko)

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKB1'])
    await checkListAfterFiltering(page, [7], Exam.Suko)

    await setMultiSelectDropdownOptions(page, 'oppimaaraFilter', ['VKB1.IA'])
    await checkListAfterFiltering(page, [7], Exam.Suko)
  })

  test('ld', async ({ page }) => {
    await page.goto('/ld/koetehtavat')

    await setMultiSelectDropdownOptions(page, 'lukuvuosiFilter', ['20202021'])
    await setMultiSelectDropdownOptions(page, 'aineFilter', ['6']) // musiikki
    await checkListAfterFiltering(page, [5], Exam.Ld)

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
    await checkListAfterFiltering(page, [8], Exam.Puhvi)

    await page.getByRole('link', { name: filterTestAssignmentName(8, TeachingLanguage.fi, Exam.Puhvi) }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText(
      filterTestAssignmentName(8, TeachingLanguage.fi, Exam.Puhvi)
    )
  })
})
