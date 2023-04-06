import { expect, test } from '@playwright/test'

test.describe('Assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-exam-suko').click()
    await page.waitForSelector('text=Koetehtävät')
    await page.getByTestId('create-koetehtävä-button').click()
  })

  test('can create a new assignment', async ({ page }) => {
    const nameText = 'Testi tehtävä'
    const contentText = 'Testi sisältö'

    const el = page.getByTestId('heading')

    await expect(el).toHaveText('Luo uusi koetehtävä')

    await page.getByLabel('Tehtävän nimi').fill(nameText)
    await page.getByLabel('Tekstin lukeminen').click()
    await page.getByLabel('Tehtävän sisältö').fill(contentText)

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')
  })

  test('can create draft assignment', async ({ page }) => {
    const el = page.getByTestId('heading')

    await expect(el).toHaveText('Luo uusi koetehtävä')

    await page.getByLabel('Tehtävän nimi').fill('Testi luonnos tehtävä')
    await page.getByLabel('Tekstin lukeminen').click()
    await page.getByLabel('Tehtävän sisältö').fill('Testi luonnos sisältö')

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnos')
  })

  test('can cancel assignment creation', async ({ page }) => {
    const el = page.getByTestId('heading')

    await expect(el).toHaveText('Luo uusi koetehtävä')

    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
  })
})
