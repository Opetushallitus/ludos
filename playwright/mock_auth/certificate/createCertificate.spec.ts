import { Page, expect, test } from '@playwright/test'
import path from 'path'

async function uploadFile(page: Page) {
  const filePath = path.resolve(__dirname, '../../fixtures/fixture.pdf')

  await page.locator('#fileInput').setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId('fixture.pdf')).toHaveText(`fixture.pdfopen_in_new${formattedDate}`)
}

test.describe('Suko certificate form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('tab-todistukset').click()
    await page.getByTestId('create-todistus-button').click()
  })

  test('can create a new Suko certification', async ({ page }) => {
    await page.getByTestId('nameFi').click()
    await page.getByTestId('nameFi').fill('Testi todistus')
    await page.getByTestId('nameFi').press('Tab')
    await page.getByTestId('contentFi').fill('Todistuksen kuvaus')

    await uploadFile(page)

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi todistus')
  })

  test('can create draft certificate', async ({ page }) => {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel certificate creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-todistus-button')
  })
})

test.describe('Puhvi certificate form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-puhvi').click()
    await page.getByTestId('tab-todistukset').click()
    await page.getByTestId('create-todistus-button').click()
  })

  test('can create a new Puhvi certification', async ({ page }) => {
    await page.getByTestId('nameFi').click()
    await page.getByTestId('nameFi').fill('Testi todistus')
    await page.getByTestId('nameFi').press('Tab')
    await page.getByTestId('contentFi').fill('Todistuksen kuvaus')

    await uploadFile(page)

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi todistus')
  })

  test('can create draft certificate', async ({ page }) => {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel certificate creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-todistus-button')
  })
})

test.describe('Ld certificate form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-ld').click()
    await page.getByTestId('tab-todistukset').click()
    await page.getByTestId('create-todistus-button').click()
  })

  test('can create a new Ld certification', async ({ page }) => {
    await page.getByTestId('nameFi').click()
    await page.getByTestId('nameFi').fill('Testi todistus')
    await page.getByTestId('nameFi').press('Tab')
    await page.getByTestId('contentFi').fill('Todistuksen kuvaus')

    await uploadFile(page)

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi todistus')
  })

  test('can create draft certificate', async ({ page }) => {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel certificate creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-todistus-button')
  })
})
