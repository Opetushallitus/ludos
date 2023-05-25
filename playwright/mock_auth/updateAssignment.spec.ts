import { expect, test } from '@playwright/test'
import { fillAssignmentForm, updateAssignmentForm } from '../helpers'

test.describe('Assignment form tests', () => {
  let createdAssignmentId: number

  test('can update a new assignment', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-link-suko').click()

    await page.getByTestId('create-koetehtava-button').click()

    await fillAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll',
      instructionTextFi: 'Testi ohjeet',
      instructionTextSv: 'Testa instruktioner'
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

    await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    await updateAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä muokattu',
      nameTextSv: 'Testuppgifter muokattu',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testa innehåll muokattu',
      instructionTextFi: 'Testi ohjeet muokattu',
      instructionTextSv: 'Testa instruktioner muokattu'
    })

    await page.getByTestId('form-submit').click()

    const updatedAssignmentHeader = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeader).toHaveText('Testi tehtävä muokattu')

    page.getByText('Tehtävätyyppi: Tekstin tiivistäminen')
    page.getByText('Tavoitetaso:A1.2 Kehittyvä alkeiskielitaito')
    page.getByText('Laaja-alainen osaaminen:Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, V')

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    const updatedAssignmentHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeaderSv).toHaveText('Testuppgifter muokattu')
  })
})
