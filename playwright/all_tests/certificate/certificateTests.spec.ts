import { BrowserContext, Page, expect, test } from '@playwright/test'
import path from 'path'
import { Role, loginTestGroup } from '../../helpers'

type Event = 'submit' | 'draft' | 'cancel'

async function selectAttachmentFile(page: Page, context: BrowserContext, file: string) {
  const filePath = path.resolve(__dirname, `../../fixtures/${file}`)

  await page.locator('#fileInput').setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file)).toHaveText(`${file}${formattedDate}`)
}

async function testAttachmentLink(page: Page, context: BrowserContext, filename: string, expectedSize: number) {
  const attachmentLink = await page.getByRole('link', { name: `${filename} open_in_new` })
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
    await page.getByTestId('create-todistus-button')

    return
  }

  await selectAttachmentFile(page, context, 'fixture.pdf')

  const nameText = certificateNameByEvent(event)
  const descriptionText = 'Todistuksen kuvaus'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)

  if (event === 'submit') {
    page.getByTestId('form-submit').click()
  } else {
    const draftButton = page.getByTestId('form-draft')
    await expect(draftButton).toHaveText('Tallenna luonnoksena')
    draftButton.click()
  }

  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/certificate') && response.ok()
  )

  const responseData = await response.json()

  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(nameText)
  await page.getByText(descriptionText, { exact: true })

  const attachment = await page.getByTestId('fixture.pdf').allTextContents()
  await expect(attachment[0]).toContain('fixture.pdf')

  await testAttachmentLink(page, context, 'fixture.pdf', 1799)

  await page.getByText(event === 'submit' ? 'Julkaistu' : 'Luonnos', { exact: true })
  return responseData.id
}

async function updateCertificate(page: Page, context: BrowserContext, event: Event, certificateId: string) {
  await page.getByTestId(`certificate-${certificateId}`).getByRole('link', { name: 'Testi todistus' })
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(certificateNameByEvent(event))

  await page.getByTestId('edit-content-btn').click()

  if (event === 'cancel') {
    // TODO: We never go here, add a test that creates a draft and then cancels the update
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    await page.getByTestId('create-todistus-button')

    return
  }

  await selectAttachmentFile(page, context, 'fixture2.pdf')

  const nameText = certificateNameByEvent(event) + ' päivitetty'
  const descriptionText = 'Todistuksen kuvaus päivitetty'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)
  if (event === 'submit') {
    await page.getByTestId('form-submit').click()
  } else if (event === 'draft') {
    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()
  }

  await expect(header).toHaveText(nameText)
  await page.getByText(nameText, { exact: true })
  await page.getByText(descriptionText, { exact: true })
  await page.getByText(event === 'submit' ? 'Julkaistu' : 'Luonnos', { exact: true })

  await testAttachmentLink(page, context, 'fixture2.pdf', 1805)
}

async function doCreateAndUpdate(page: Page, context: BrowserContext, event: Event) {
  const certificateId = await createCertificate(page, context, event)

  if (certificateId) {
    await updateCertificate(page, context, event, certificateId)
  }
}

loginTestGroup(test, Role.YLLAPITAJA)

const exams = ['suko', 'ld', 'puhvi']

exams.forEach((exam) => {
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
