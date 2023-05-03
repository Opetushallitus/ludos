import { expect, test } from '@playwright/test'
import { fillSukoForm } from '../helpers'

test.describe('Assignment form tests', () => {
  let createdAssignmentId: number

  test('can create a new assignment', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-link-content-suko').click()

    await page.getByTestId('create-koetehtava-button').click()

    await fillSukoForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll'
    })

    await page.getByTestId('form-submit').click()

    const response = await page.waitForResponse((response) => {
      return response.url().includes('/api/assignment/') && response.ok()
    })

    const responseData = await response.json()
    createdAssignmentId = responseData.id

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')

    await page.getByTestId('return').click()

    await page.getByTestId(`assignment-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    await fillSukoForm({
      page,
      nameTextFi: 'Testi tehtävä muokattu',
      nameTextSv: 'Testuppgifter muokattu',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testa innehåll muokattu'
    })

    await page.getByTestId('form-submit').click()

    const updatedAssignmentHeader = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeader).toHaveText('Testi tehtävä muokattu')

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    const updatedAssignmentHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeaderSv).toHaveText('Testuppgifter muokattu')
  })
})
