import { expect, Page, test } from '@playwright/test'
import { loginTestGroup, Role } from '../../helpers'

loginTestGroup(test, Role.YLLAPITAJA)

async function checkListAfterFiltering(page: Page, expectedAssignmentTitleNumbers: number[]) {
  const assignments = await page.getByTestId('assignment-list').locator('li').all()
  const namePromises = assignments.map((listItem) => listItem.getByTestId('assignment-name-link').innerText())
  const names = await Promise.all(namePromises)
  expect(names).toEqual(expectedAssignmentTitleNumbers.map((number) => `Test name ${number} FI`))
}

test.describe('Assignment filter tests', () => {
  test('suko, ld, puhvi', async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seed')

    // SUKO
    await page.goto('/suko')

    await page.getByTestId('oppimaara').click()
    // Suomi-oppimäärä options
    await page.getByTestId('oppimaara-option-TKFI').click()
    await page.getByTestId('oppimaara-option-TKFIA1').click()
    await page.getByTestId('oppimaara-option-TKFIB1').click()
    await page.getByTestId('oppimaara-option-TKFIB3').click()
    await page.getByTestId('oppimaara-multi-select-ready-button').click()

    await page.getByTestId('contentType').click()
    // keskustelu
    await page.getByTestId('contentType-option-003').click()
    await page.getByTestId('contentType-multi-select-ready-button').click()

    await page.getByTestId('aihe').click()

    // Pohjoismaat
    await page.getByTestId('aihe-option-013').click()
    await page.getByTestId('aihe-multi-select-ready-button').click()

    await checkListAfterFiltering(page, [2])

    // await page.getByTestId('tavoitetaitotaso-input').fill('b1')
    // await page.getByTestId('tavoitetaitotaso').click()
    // B1.1
    // await page.getByTestId('tavoitetaitotaso-option-0007').click()
    // B1.2
    // await page.getByTestId('tavoitetaitotaso-option-0008').click()

    // refresh page to make sure filters stay
    await page.reload()

    await expect(page.getByRole('link', { name: 'Test name 2 FI' })).toBeVisible()
    await checkListAfterFiltering(page, [2])

    await page.getByRole('link', { name: 'Test name 2 FI' }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 2 FI')
    await page.getByTestId('return').click()

    // make sure filters stay when returning from an assignment
    await expect(page.getByRole('link', { name: 'Test name 2 FI' })).toBeVisible()
    await checkListAfterFiltering(page, [2])

    // remove selections from assignmentType filter
    await page.getByTestId('contentType-reset-selected-options').click()
    await expect(page.getByRole('link', { name: 'Test name 7 FI' })).toBeVisible()
    await checkListAfterFiltering(page, [7, 2, 1])

    // LD
    await page.goto('/ld')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20202021').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('aine').click()
    // musiikki
    await page.getByTestId('aine-option-6').click()
    await page.getByTestId('aine-multi-select-ready-button').click()
    await expect(page.getByRole('link', { name: 'Test name 5 FI' })).toBeVisible()
    await checkListAfterFiltering(page, [5])
    await page.getByRole('link', { name: 'Test name 5 FI' }).click()

    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 5 FI')
    await page.getByTestId('return').click()

    // Puhvi
    await page.goto('/puhvi')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20242025').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('tehtavatyyppiPuhvi').click()
    // esiintymistaidot
    await page.getByTestId('tehtavatyyppiPuhvi-option-002').click()
    await page.getByTestId('tehtavatyyppiPuhvi-multi-select-ready-button').click()

    await expect(page.getByRole('link', { name: 'Test name 8 FI' })).toBeVisible()
    await checkListAfterFiltering(page, [8])
    await page.getByRole('link', { name: 'Test name 8 FI' }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 8 FI')
  })
})
