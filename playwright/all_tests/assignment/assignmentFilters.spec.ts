import { expect, test } from '@playwright/test'
import { Exam, loginTestGroup, Role } from '../../helpers'
import { checkListAfterFiltering } from './assignmentHelpers'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Assignment filter tests', () => {
  test('suko, ld, puhvi', async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seed')

    // SUKO
    await page.goto('/suko/koetehtavat')

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

    await checkListAfterFiltering(page, [2], Exam.Suko)

    // await page.getByTestId('tavoitetaitotaso-input').fill('b1')
    // await page.getByTestId('tavoitetaitotaso').click()
    // B1.1
    // await page.getByTestId('tavoitetaitotaso-option-0007').click()
    // B1.2
    // await page.getByTestId('tavoitetaitotaso-option-0008').click()

    // refresh page to make sure filters stay
    await page.reload()

    await expect(page.getByRole('link', { name: 'Test name 2 FI SUKO' })).toBeVisible()
    await checkListAfterFiltering(page, [2], Exam.Suko)

    await page.getByRole('link', { name: 'Test name 2 FI SUKO' }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 2 FI SUKO')
    await page.getByTestId('return').click()

    // make sure filters stay when returning from an assignment
    await expect(page.getByRole('link', { name: 'Test name 2 FI SUKO' })).toBeVisible()
    await checkListAfterFiltering(page, [2], Exam.Suko)

    // remove selections from assignmentType filter
    await page.getByTestId('contentType-reset-selected-options').click()
    await expect(page.getByRole('link', { name: 'Test name 7 FI SUKO' })).toBeVisible()
    await checkListAfterFiltering(page, [7, 2, 1], Exam.Suko)

    // LD
    await page.goto('/ld/koetehtavat')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20202021').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('aine').click()
    // musiikki
    await page.getByTestId('aine-option-6').click()
    await page.getByTestId('aine-multi-select-ready-button').click()
    await expect(page.getByRole('link', { name: 'Test name 5 FI LD' })).toBeVisible()
    await checkListAfterFiltering(page, [5], Exam.Ld)
    await page.getByRole('link', { name: 'Test name 5 FI LD' }).click()

    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 5 FI LD')
    await page.getByTestId('return').click()

    // Puhvi
    await page.goto('/puhvi/koetehtavat')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20242025').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('tehtavatyyppiPuhvi').click()
    // esiintymistaidot
    await page.getByTestId('tehtavatyyppiPuhvi-option-002').click()
    await page.getByTestId('tehtavatyyppiPuhvi-multi-select-ready-button').click()

    await expect(page.getByRole('link', { name: 'Test name 8 FI PUHVI' })).toBeVisible()
    await checkListAfterFiltering(page, [8], Exam.Puhvi)
    await page.getByRole('link', { name: 'Test name 8 FI PUHVI' }).click()
    await expect(page.getByTestId('assignment-header')).toHaveText('Test name 8 FI PUHVI')
  })
})
