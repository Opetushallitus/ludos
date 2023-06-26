import { Page, expect, test } from '@playwright/test'
import path from 'path'

async function beforeEach(page: Page, exam: string) {
  await page.goto('/')
  await page.getByTestId(`nav-link-${exam}`).click()
  await page.getByTestId('tab-todistukset').click()
  await page.getByTestId('create-todistus-button').click()
}

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

async function createCertificate(page: Page, event: string) {
  if (event === 'cancel') {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await page.getByTestId('create-todistus-button')

    return
  }

  await page.getByTestId('nameFi').click()
  await page.getByTestId('nameFi').fill('Testi todistus')
  await page.getByTestId('contentFi').fill('Todistuksen kuvaus')

  await uploadFile(page)

  if ('submit') {
    await page.getByTestId('form-submit').click()
    const header = page.getByTestId('assignment-header')
    await expect(header).toHaveText('Testi todistus')
  } else if (event === 'draft') {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()
    await page.getByText('Luonnos', { exact: true })
  }
}

test.describe('Suko certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'suko'))

  test('can create a new Suko certification', async ({ page }) => await createCertificate(page, 'submit'))
  test('can create draft certificate', async ({ page }) => await createCertificate(page, 'draft'))
  test('can cancel certificate creation', async ({ page }) => await createCertificate(page, 'cancel'))
})

test.describe('Puhvi certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'puhvi'))

  test('can create a new Puhvi certification', async ({ page }) => await createCertificate(page, 'submit'))
  test('can create draft certificate', async ({ page }) => await createCertificate(page, 'draft'))
  test('can cancel certificate creation', async ({ page }) => await createCertificate(page, 'cancel'))
})

test.describe('Ld certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'ld'))

  test('can create a new Ld certification', async ({ page }) => await createCertificate(page, 'submit'))
  test('can create draft certificate', async ({ page }) => await createCertificate(page, 'draft'))
  test('can cancel certificate creation', async ({ page }) => await createCertificate(page, 'cancel'))
})
