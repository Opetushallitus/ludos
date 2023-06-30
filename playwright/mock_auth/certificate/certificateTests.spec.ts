import { BrowserContext, Page, expect, test } from '@playwright/test'
import path from 'path'

async function beforeEach(page: Page, exam: string) {
  await page.goto('/')
  await page.getByTestId(`nav-link-${exam}`).click()
  await page.getByTestId('tab-todistukset').click()
  await page.getByTestId('create-todistus-button').click()
}

async function uploadFile(page: Page, context: BrowserContext, file: string) {
  const filePath = path.resolve(__dirname, `../../fixtures/${file}`)

  await page.locator('#fileInput').setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file)).toHaveText(`${file}open_in_new${formattedDate}`)
  await page.getByRole('link', { name: `${file} open_in_new` }).click()
  await context.waitForEvent('page', { predicate: (newPage) => newPage !== page })
  const pages = await context.pages()
  const newTab = pages[pages.length - 1]
  await newTab.waitForLoadState('domcontentloaded')
  const pdfContent = await newTab.content()

  expect(pdfContent).toContain('embed')
  expect(pdfContent).toContain('type="application/pdf"')

  await newTab.close()
}

async function createCertificate(page: Page, context: BrowserContext, event: string): Promise<string | undefined> {
  if (event === 'cancel') {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await page.getByTestId('create-todistus-button')

    return
  }

  await uploadFile(page, context, 'fixture.pdf')

  if ('submit') {
    const nameText = 'Testi todistus'
    const descriptionText = 'Todistuksen kuvaus'

    await page.getByTestId('name').fill(nameText)
    await page.getByTestId('description').fill(descriptionText)

    await page.getByTestId('form-submit').click()

    const response = await page.waitForResponse(
      (response) => response.url().includes('/api/certificate') && response.ok()
    )

    const responseData = await response.json()

    const header = page.getByTestId('assignment-header')
    await expect(header).toHaveText(nameText)

    await page.getByText(nameText, { exact: true })
    await page.getByText(descriptionText, { exact: true })

    const attachment = await page.getByTestId('fixture.pdf').allTextContents()
    await expect(attachment[0]).toContain('fixture.pdf')

    return responseData.id
  } else if (event === 'draft') {
    const nameText = 'Testi todistus draft'
    const descriptionText = 'Todistuksen kuvaus draft'

    await page.getByTestId('name').fill(nameText)
    await page.getByTestId('description').fill(descriptionText)

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()

    const response = await page.waitForResponse(
      (response) => response.url().includes('/api/certificate') && response.ok()
    )

    const responseData = await response.json()

    const header = page.getByTestId('assignment-header')
    await expect(header).toHaveText(nameText)

    await page.getByText(nameText, { exact: true })
    await page.getByText(descriptionText, { exact: true })

    const attachment = await page.getByTestId('fixture.pdf').allTextContents()
    await expect(attachment[0]).toContain('fixture.pdf')

    await page.getByText('Luonnos', { exact: true })

    return responseData.id
  }

  await page.getByTestId('return').click()
}

async function updateCertificate(page: Page, context: BrowserContext, event: string, certificateId: string) {
  await page.getByTestId(`certificate-${certificateId}`).getByRole('link', { name: 'Testi todistus' })
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText('Testi todistus')

  await page.getByTestId('edit-content-btn').click()

  if (event === 'cancel') {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await page.getByTestId('create-todistus-button')

    return
  }

  await uploadFile(page, context, 'fixture2.pdf')

  if (event === 'submit') {
    const nameText = 'Updated Testi todistus'
    const descriptionText = 'Updated Todistuksen kuvaus'

    await page.getByTestId('name').fill(nameText)
    await page.getByTestId('description').fill(descriptionText)

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')
    await expect(header).toHaveText('Updated Testi todistus')
    await page.getByText(nameText, { exact: true })
    await page.getByText(descriptionText, { exact: true })
  } else if (event === 'draft') {
    const nameText = 'Updated Testi todistus draft'
    const descriptionText = 'Updated Todistuksen kuvaus draft'

    await page.getByTestId('name').fill(nameText)
    await page.getByTestId('description').fill(descriptionText)

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()

    await page.getByText('Luonnos', { exact: true })
  }
}

async function doCreateAndUpdate(page: Page, context: BrowserContext) {
  const certificateId = await createCertificate(page, context, 'submit')

  if (certificateId) {
    await updateCertificate(page, context, 'submit', certificateId)
  }
}

test.describe('Suko certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'suko'))

  test('can create a new Suko certification', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can create draft certificate', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can cancel certificate creation', async ({ page, context }) => await doCreateAndUpdate(page, context))
})

test.describe('Puhvi certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'puhvi'))

  test('can create a new Puhvi certification', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can create draft certificate', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can cancel certificate creation', async ({ page, context }) => await doCreateAndUpdate(page, context))
})

test.describe('Ld certificate form tests', () => {
  test.beforeEach(async ({ page }) => await beforeEach(page, 'ld'))

  test('can create a new Ld certification', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can create draft certificate', async ({ page, context }) => await doCreateAndUpdate(page, context))
  test('can cancel certificate creation', async ({ page, context }) => await doCreateAndUpdate(page, context))
})
