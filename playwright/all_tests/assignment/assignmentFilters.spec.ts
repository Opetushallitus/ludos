import { expect, Page, test } from '@playwright/test'
import { loginTestGroup, Role } from '../../helpers'

loginTestGroup(test, Role.YLLAPITAJA)

async function checkResponseAfterFiltering(page: Page, exam: 'SUKO' | 'LD' | 'PUHVI') {
  const responseLd = await page.waitForResponse((response) => {
    return response.url().includes(`/api/assignment/${exam}?`) && response.ok()
  })
  const responseDataLd = await responseLd.json()
  expect(responseDataLd).toHaveLength(1)
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
    // vaikuttaminen
    await page.getByTestId('aihe-option-007').click()
    // ympärisöt
    page.getByTestId('aihe-option-008').click()
    await checkResponseAfterFiltering(page, 'SUKO')
    await page.getByTestId('aihe-multi-select-ready-button').click()

    // await page.getByTestId('tavoitetaitotaso-input').fill('b1')
    // await page.getByTestId('tavoitetaitotaso').click()
    // B1.1
    // await page.getByTestId('tavoitetaitotaso-option-0007').click()
    // B1.2
    // await page.getByTestId('tavoitetaitotaso-option-0008').click()

    // Wait for the filtered assignments to be available
    await page.waitForSelector('li[data-testid^="assignment-list-item-"]')

    const assignmentSelector = 'li[data-testid^="assignment-list-item-"]'
    const assignments = await page.$$(assignmentSelector)

    // Check if there is only one assignment in the list
    expect(assignments).toHaveLength(1)

    await page.getByRole('link', { name: 'Test name 11 FI' }).click()

    await page.getByText('Tehtävätyyppi: Keskustelu')
    // page.getByText('Tavoitetaso: B1.1  Toimiva peruskielitaito')
    await page.getByText('Aihe: vaikuttaminen, opiskelutaidot')
    await page.getByText('Laaja-alainen osaaminen: -')

    await page.getByTestId('return').click()

    // LD
    await page.goto('/ld')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20202021').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('aine').click()
    // musiikki
    page.getByTestId('aine-option-6').click()
    await checkResponseAfterFiltering(page, 'LD')
    await page.getByTestId('aine-multi-select-ready-button').click()

    await page.getByRole('link', { name: 'Test name 5 FI' }).click()

    page.getByText('Lukuvuosi: 2020-2021, 2022-2023')
    page.getByText('Aine: Musiikki')
    page.getByText(
      'Laaja-alainen osaaminen: Monitieteinen ja luova osaaminen, Yhteiskunnallinen osaaminen, Vuorovaikutusosaaminen'
    )

    await page.getByTestId('return').click()

    // Puhvi
    await page.goto('/puhvi')

    await page.getByTestId('lukuvuosi').click()
    await page.getByTestId('lukuvuosi-option-20242025').click()
    await page.getByTestId('lukuvuosi-multi-select-ready-button').click()

    await page.getByTestId('tehtavatyyppiPuhvi').click()
    // esiintymistaidot
    await page.getByTestId('tehtavatyyppiPuhvi-option-002').click()
    checkResponseAfterFiltering(page, 'PUHVI')
    await page.getByTestId('tehtavatyyppiPuhvi-multi-select-ready-button').click()

    await page.getByRole('link', { name: 'Test name 8 FI' }).click()

    page.getByText('Tehtävätyyppi:Esiintymistaidot')
    page.getByText('Lukuvuosi: 2022-2023')
    page.getByText('Laaja-alainen osaaminen:Yhteiskunnallinen osaaminen, Vuorovaikutusosaaminen')

    await page.getByTestId('return').click()
  })
})
