import { BrowserContext, expect, Page, test } from '@playwright/test'
import path from 'path'
import { assertSuccessNotification, examsLowerCase, FormAction, loginTestGroup, Role } from '../../helpers'

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

function certificateNameByAction(action: FormAction): string {
  switch (action) {
    case 'submit':
      return 'Testi todistus'
    case 'draft':
      return 'Testi todistus draft'
    case 'cancel':
      return 'Testi todistus cancel'
    case 'delete':
      return 'Testi todistus delete'
  }
}

async function createCertificate(
  page: Page,
  context: BrowserContext,
  action: FormAction,
  expectedNotification: string
) {
  await selectAttachmentFile(page, 'fixture1.pdf')

  const nameText = certificateNameByAction(action)
  const descriptionText = 'Todistuksen kuvaus'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)

  if (action === 'submit') {
    void page.getByTestId('form-submit').click()
  } else {
    void page.getByTestId('form-draft').click()
  }

  const responseFromClick = await page.waitForResponse(
    (response) => response.url().includes('/api/certificate') && response.ok()
  )

  const responseData = await responseFromClick.json()

  await assertSuccessNotification(page, expectedNotification)

  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(nameText)
  await expect(page.getByText(descriptionText, { exact: true })).toBeVisible()

  const attachment = await page.getByTestId('fixture1.pdf').allTextContents()
  expect(attachment[0]).toContain('fixture1.pdf')

  await testAttachmentLink(page, context, 'fixture1.pdf', 323)

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  return { id: responseData.id, nameFromCreate: nameText }
}

async function updateCertificate(
  page: Page,
  context: BrowserContext,
  expectedCurrentName: string,
  action: FormAction,
  expectedNotification: string
) {
  await expect(page.getByTestId('assignment-header')).toBeVisible()

  await page.getByTestId('edit-content-btn').click()

  const formHeader = page.getByTestId('heading')
  await expect(formHeader).toHaveText(expectedCurrentName)

  const nameText = `${expectedCurrentName} päivitetty`
  const descriptionText = 'Todistuksen kuvaus päivitetty'

  await page.getByTestId('name').fill(nameText)
  await page.getByTestId('description').fill(descriptionText)

  await selectAttachmentFile(page, 'fixture2.pdf')

  if (action === 'submit') {
    await page.getByTestId('form-submit').click()
  } else if (action === 'draft') {
    await page.getByTestId('form-draft').click()
  }
  await assertSuccessNotification(page, expectedNotification)

  const contentPageHeader = page.getByTestId('assignment-header')
  const name = page.getByTestId('certificate-name')
  const description = page.getByTestId('certificate-description')

  await expect(contentPageHeader).toHaveText(nameText)
  await expect(name).toHaveText(nameText)
  await expect(description).toHaveText(descriptionText)
  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, 'fixture2.pdf', 331)

  return nameText
}

async function deleteCertificate(page: Page, certificateId: string, exam: string) {
  await expect(page.getByTestId('assignment-header')).toBeVisible()

  await page.getByTestId('edit-content-btn').click()
  await page.getByTestId('form-delete').click()
  await page.getByTestId('modal-button-delete').click()

  await assertSuccessNotification(page, 'todistuksen-poisto.onnistui')

  // expect not to find the deleted certificate from a list
  await expect(page.getByTestId(`certificate-${certificateId}`)).toBeHidden()

  await page.goto(`/${exam}/todistukset/${certificateId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

async function createPublishedAndUpdateAndDelete(page: Page, context: BrowserContext, exam: string) {
  const { id, nameFromCreate } = await createCertificate(
    page,
    context,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    page,
    context,
    nameFromCreate,
    'draft',
    'form.notification.todistuksen-tallennus.palautettu-luonnostilaan'
  )

  const nameFromUpdate2 = await updateCertificate(
    page,
    context,
    nameFromUpdate,
    'draft',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    page,
    context,
    nameFromUpdate2,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  await deleteCertificate(page, id, exam)
}

async function createDraftAndUpdateAndDelete(page: Page, context: BrowserContext, exam: string) {
  const { id, nameFromCreate } = await createCertificate(
    page,
    context,
    'draft',
    'form.notification.todistuksen-tallennus.luonnos-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    page,
    context,
    nameFromCreate,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate2 = await updateCertificate(
    page,
    context,
    nameFromUpdate,
    'submit',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    page,
    context,
    nameFromUpdate2,
    'draft',
    'form.notification.todistuksen-tallennus.palautettu-luonnostilaan'
  )

  await deleteCertificate(page, id, exam)
}

async function cancelCreatingCertificate(page: Page) {
  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')
  await btn.click()
  await expect(page.getByTestId('create-todistus-button')).toBeVisible()
}

async function cancelUpdatingCertificate(page: Page, context: BrowserContext) {
  const { nameFromCreate } = await createCertificate(
    page,
    context,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  await expect(page.getByTestId('assignment-header')).toBeVisible()

  await page.getByTestId('edit-content-btn').click()

  const formHeader = page.getByTestId('heading')
  await expect(formHeader).toHaveText(nameFromCreate)

  await page.getByTestId('form-cancel').click()
  await expect(page.getByTestId('assignment-header')).toBeVisible()
}

loginTestGroup(test, Role.YLLAPITAJA)

examsLowerCase.forEach((exam) => {
  test.describe(`${exam} certificate form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam}`).click()
      await page.getByTestId('tab-todistukset').click()
      await page.getByTestId('create-todistus-button').click()
    })

    test(`can create, update and delete a new published ${exam} certificate`, async ({ page, context }) =>
      await createPublishedAndUpdateAndDelete(page, context, exam))
    test(`can create, update and delete a new draft ${exam} certificate`, async ({ page, context }) =>
      await createDraftAndUpdateAndDelete(page, context, exam))
    test(`can cancel ${exam} certificate creation`, async ({ page }) => await cancelCreatingCertificate(page))
    test(`can cancel ${exam} certificate update`, async ({ page, context }) =>
      await cancelUpdatingCertificate(page, context))
  })
})
