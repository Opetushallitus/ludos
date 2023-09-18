import { BrowserContext, expect, Page, test } from '@playwright/test'
import path from 'path'
import { loginTestGroup, Exam, Role, examsLowerCase } from '../../helpers'

type Event = 'submit' | 'draft' | 'cancel'

async function selectAttachmentFile(page: Page, file: string) {
  const filePath = path.resolve(__dirname, `../../../server/src/main/resources/fixtures/${file}`)

  await page.locator('#fileInput-fi').setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file)).toHaveText(`${file}${formattedDate}`)
}

async function testAttachmentLink(page: Page, context: BrowserContext, filename: string, expectedSize: number) {
  const attachmentLink = page.getByRole('link', { name: `${filename} open_in_new` })
  const attachmentLinkTarget = await attachmentLink.evaluate((l) => l.getAttribute('target'))
  const attachmentLinkHref = await attachmentLink.evaluate((l) => l.getAttribute('href'))

  expect(attachmentLinkTarget).toBe('_blank')
  expect(attachmentLinkHref).not.toBeNull()

  const attachmentResponse = await context.request.get(attachmentLinkHref!)
  expect(attachmentResponse.status()).toBe(200)
  expect(attachmentResponse.headers()['content-type']).toBe('application/pdf')
  expect(attachmentResponse.headers()['content-disposition']).toBe(`inline; filename="${filename}"`)
  expect(Buffer.byteLength(await attachmentResponse.body())).toBe(expectedSize)
}

function certificateNameByEvent(event: Event): string {
  switch (event) {
    case 'submit':
      return 'Testi todistus'
    case 'draft':
      return 'Testi todistus draft'
    case 'cancel':
      return 'Testi todistus cancel'
  }
}

async function createCertificate(page: Page, context: BrowserContext, event: Event): Promise<string | undefined> {
  if (event === 'cancel') {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await expect(page.getByTestId('create-todistus-button')).toBeVisible()

    return
  }

  await selectAttachmentFile(page, 'fixture1.pdf')

  const nameText = certificateNameByEvent(event)
  const descriptionText = 'Todistuksen kuvaus'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)

  if (event === 'submit') {
    void page.getByTestId('form-submit').click()
  } else {
    const draftButton = page.getByTestId('form-draft')
    await expect(draftButton).toHaveText('Tallenna luonnoksena')
    void draftButton.click()
  }

  const responseFromClick = await page.waitForResponse(
    (response) => response.url().includes('/api/certificate') && response.ok()
  )

  const responseData = await responseFromClick.json()

  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(nameText)
  await expect(page.getByText(descriptionText, { exact: true })).toBeVisible()

  const attachment = await page.getByTestId('fixture1.pdf').allTextContents()
  expect(attachment[0]).toContain('fixture1.pdf')

  await testAttachmentLink(page, context, 'fixture1.pdf', 323)

  await expect(page.getByText(event === 'submit' ? 'Julkaistu' : 'Luonnos', { exact: true })).toBeVisible()

  return responseData.id
}

async function updateCertificate(page: Page, context: BrowserContext, event: Event) {
  await expect(page.getByTestId('assignment-header')).toBeVisible()

  await page.getByTestId('edit-content-btn').click()

  const formHeader = page.getByTestId('heading')
  await expect(formHeader).toHaveText(certificateNameByEvent(event))

  if (event === 'cancel') {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await expect(page.getByTestId('create-todistus-button')).toBeVisible()

    return
  }

  const nameText = `${certificateNameByEvent(event)} päivitetty`
  const descriptionText = 'Todistuksen kuvaus päivitetty'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)

  await selectAttachmentFile(page, 'fixture2.pdf')

  if (event === 'submit') {
    await page.getByTestId('form-submit').click()
  } else if (event === 'draft') {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()
  }

  const contentPageHeader = page.getByTestId('assignment-header')
  const name = page.getByTestId('certificate-name')
  const description = page.getByTestId('certificate-description')

  await expect(contentPageHeader).toHaveText(nameText)
  await expect(name).toHaveText(nameText)
  await expect(description).toHaveText(descriptionText)
  await expect(page.getByText(event === 'submit' ? 'Julkaistu' : 'Luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, 'fixture2.pdf', 331)
}

async function doCreateAndUpdate(page: Page, context: BrowserContext, event: Event) {
  const certificateId = await createCertificate(page, context, event)

  if (certificateId) {
    await updateCertificate(page, context, event)
  }
}

loginTestGroup(test, Role.YLLAPITAJA)

examsLowerCase.forEach((exam) => {
  test.describe(`${exam} certificate form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId(`nav-link-${exam}`).click()
      await page.getByTestId('tab-todistukset').click()
      await page.getByTestId('create-todistus-button').click()
    })

    test(`can create and update a new published ${exam} certificate`, async ({ page, context }) =>
      await doCreateAndUpdate(page, context, 'submit'))
    test(`can create and update a new draft ${exam} certificate`, async ({ page, context }) =>
      await doCreateAndUpdate(page, context, 'draft'))
    test(`can cancel ${exam} certificate creation`, async ({ page, context }) =>
      await doCreateAndUpdate(page, context, 'cancel'))
  })
})
