import { expect, test } from '@playwright/test'
import { fillSukoAssignmentForm, updateSukoAssignmentForm } from './assignmentHelpers'
import { Role, loginTestGroup } from '../../helpers'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Assignment form tests', () => {
  let createdAssignmentId: number

  test('can update a new assignment', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-link-suko').click()

    await page.getByTestId('create-koetehtava-button').click()

    await fillSukoAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll',
      instructionTextFi: 'Testi ohjeet',
      instructionTextSv: 'Testa instruktioner'
    })

    page.getByTestId('form-submit').click()

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

    await updateSukoAssignmentForm({
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
