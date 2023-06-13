import { expect, test } from '@playwright/test'
import { fillInstructionForm } from './instructionHelpers'

test.describe('Assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('tab-ohjeet').click()
    await page.getByTestId('create-ohje-button').click()
  })

  test('can create a new instruction', async ({ page }) => {
    await fillInstructionForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll'
    })

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')
  })

  test('can create draft instruction', async ({ page }) => {
    await page.getByTestId('nameFi').fill('Testi luonnos tehtävä')
    await page.getByTestId('contentFi').fill('Testi luonnos sisältö')

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
  })
})
