import { BrowserContext, expect, Page, test } from '@playwright/test'
import {
  assertSuccessNotification,
  FormAction,
  loginTestGroup,
  Role,
  setSingleSelectDropdownOption
} from '../../helpers'
import { Exam } from 'web/src/types'
import { assertContentPage, selectAttachmentFile } from './certificateHelpers'

const attachment1 = {
  name: 'fixture1.pdf',
  size: 323
}

const attachment2 = {
  name: 'fixture2.pdf',
  size: 331
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
  exam: Exam,
  action: FormAction,
  expectedNotification: string
) {
  await selectAttachmentFile(page, 'fixture1.pdf')

  const nameText = certificateNameByAction(action)
  const descriptionText = 'Todistuksen kuvaus'

  await page.getByTestId('name').fill(nameText)
  if (exam === Exam.LD) {
    await setSingleSelectDropdownOption(page, 'aineKoodiArvo', '9')
  } else {
    await page.getByTestId('description').fill(descriptionText)
  }

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
  await assertContentPage(page, context, exam, action, nameText, descriptionText, attachment1)

  return { id: responseData.id, nameFromCreate: nameText }
}

async function updateCertificate(
  page: Page,
  context: BrowserContext,
  exam: Exam,
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

  if (exam === Exam.LD) {
    await setSingleSelectDropdownOption(page, 'aineKoodiArvo', '9')
  } else {
    await page.getByTestId('description').fill(descriptionText)
  }

  await selectAttachmentFile(page, 'fixture2.pdf')

  if (action === 'submit') {
    await page.getByTestId('form-submit').click()
  } else if (action === 'draft') {
    await page.getByTestId('form-draft').click()
  }
  await assertSuccessNotification(page, expectedNotification)
  await assertContentPage(page, context, exam, action, nameText, descriptionText, attachment2)

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

  await page.goto(`/${exam.toLowerCase()}/todistukset/${certificateId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

async function createPublishedAndUpdateAndDelete(page: Page, context: BrowserContext, exam: Exam) {
  const { id, nameFromCreate } = await createCertificate(
    page,
    context,
    exam,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    page,
    context,
    exam,
    nameFromCreate,
    'draft',
    'form.notification.todistuksen-tallennus.palautettu-luonnostilaan'
  )

  const nameFromUpdate2 = await updateCertificate(
    page,
    context,
    exam,
    nameFromUpdate,
    'draft',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    page,
    context,
    exam,
    nameFromUpdate2,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  await deleteCertificate(page, id, exam)
}

async function createDraftAndUpdateAndDelete(page: Page, context: BrowserContext, exam: Exam) {
  const { id, nameFromCreate } = await createCertificate(
    page,
    context,
    exam,
    'draft',
    'form.notification.todistuksen-tallennus.luonnos-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    page,
    context,
    exam,
    nameFromCreate,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate2 = await updateCertificate(
    page,
    context,
    exam,
    nameFromUpdate,
    'submit',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    page,
    context,
    exam,
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

async function cancelUpdatingCertificate(page: Page, context: BrowserContext, exam: Exam) {
  const { nameFromCreate } = await createCertificate(
    page,
    context,
    exam,
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
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} certificate form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
      await page.getByTestId('tab-todistukset').click()
      await page.getByTestId('create-todistus-button').click()
    })

    test(`can create, update and delete a new published ${exam} certificate`, async ({ page, context }) =>
      await createPublishedAndUpdateAndDelete(page, context, exam))
    test(`can create, update and delete a new draft ${exam} certificate`, async ({ page, context }) =>
      await createDraftAndUpdateAndDelete(page, context, exam))
    test(`can cancel ${exam} certificate creation`, async ({ page }) => await cancelCreatingCertificate(page))
    test(`can cancel ${exam} certificate update`, async ({ page, context }) =>
      await cancelUpdatingCertificate(page, context, exam))
  })
})
