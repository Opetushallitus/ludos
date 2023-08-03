import { expect, test } from '@playwright/test'
import { fillInstructionForm } from './instructionHelpers'
import { Role, loginTestGroup } from '../../helpers'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Instruction form tests', () => {
  let createdInstructionId: number

  test('can update a new instruction', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-link-suko').click()

    await page.getByTestId('tab-ohjeet').click()

    await page.getByTestId('create-ohje-button').click()

    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll'
    })

    page.getByTestId('form-submit').click()

    const response = await page.waitForResponse((response) => {
      return response.url().includes('/api/instruction/') && response.ok()
    })

    const responseData = await response.json()
    createdInstructionId = responseData.id

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi ohje')

    await page.getByTestId('return').click()

    await page.getByTestId(`instruction-${createdInstructionId.toString()}`).click()
    await page.getByTestId(`instruction-${createdInstructionId.toString()}-edit`).click()

    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje muokattu',
      nameTextSv: 'Testuppgifter redigerade',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testinstruktioner redigerade'
    })

    await page.getByTestId('form-submit').click()

    const updatedInstructionHeader = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeader).toHaveText('Testi ohje muokattu')

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    const updatedInstructionHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeaderSv).toHaveText('Testuppgifter redigerade')
  })
})
