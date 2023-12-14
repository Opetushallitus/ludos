import { BrowserContext, expect, Page, test } from '@playwright/test'
import { assertSuccessNotification, FormAction, loginTestGroup, Role } from '../../helpers'
import { Exam } from 'web/src/types'
import { assertContentPage, fillCertificateForm } from './certificateHelpers'
import { CertificateFormModel } from '../../models/CertificateFormModel'

async function createCertificate(
  form: CertificateFormModel,
  context: BrowserContext,
  action: FormAction,
  expectedNotification: string
) {
  const { page, exam } = form
  const inputs = form.createCertificateInputs(action)

  await fillCertificateForm(page, exam, inputs)

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
  await assertContentPage(page, context, exam, inputs, action)

  return { id: responseData.id, nameFromCreate: inputs.nameFi }
}

async function updateCertificate(
  form: CertificateFormModel,
  context: BrowserContext,
  expectedCurrentName: string,
  action: FormAction,
  expectedNotification: string
) {
  const { page, exam } = form
  await expect(page.getByTestId('assignment-header')).toBeVisible()

  await page.getByTestId('edit-content-btn').click()

  const formHeader = page.getByTestId('heading')
  await expect(formHeader).toHaveText(expectedCurrentName)

  const inputs = form.updateCertificateInputs(action)
  await fillCertificateForm(page, exam, inputs)

  if (action === 'submit') {
    await page.getByTestId('form-submit').click()
  } else if (action === 'draft') {
    await page.getByTestId('form-draft').click()
  }
  await assertSuccessNotification(page, expectedNotification)
  await assertContentPage(page, context, exam, inputs, action)

  return inputs.nameFi
}

async function deleteCertificate(form: CertificateFormModel, certificateId: string) {
  const { page, exam } = form

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

async function createPublishedAndUpdateAndDelete(form: CertificateFormModel, context: BrowserContext) {
  const { id, nameFromCreate } = await createCertificate(
    form,
    context,

    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    form,
    context,
    nameFromCreate,
    'draft',
    'form.notification.todistuksen-tallennus.palautettu-luonnostilaan'
  )

  const nameFromUpdate2 = await updateCertificate(
    form,
    context,
    nameFromUpdate,
    'draft',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    form,
    context,
    nameFromUpdate2,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  await deleteCertificate(form, id)
}

async function createDraftAndUpdateAndDelete(form: CertificateFormModel, context: BrowserContext) {
  const { id, nameFromCreate } = await createCertificate(
    form,
    context,
    'draft',
    'form.notification.todistuksen-tallennus.luonnos-onnistui'
  )

  const nameFromUpdate = await updateCertificate(
    form,
    context,
    nameFromCreate,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  const nameFromUpdate2 = await updateCertificate(
    form,
    context,
    nameFromUpdate,
    'submit',
    'form.notification.todistuksen-tallennus.onnistui'
  )

  await updateCertificate(
    form,
    context,
    nameFromUpdate2,
    'draft',
    'form.notification.todistuksen-tallennus.palautettu-luonnostilaan'
  )

  await deleteCertificate(form, id)
}

async function cancelCreatingCertificate(page: Page) {
  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')
  await btn.click()
  await expect(page.getByTestId('create-todistus-button')).toBeVisible()
}

async function cancelUpdatingCertificate(form: CertificateFormModel, context: BrowserContext) {
  const { page } = form
  const { nameFromCreate } = await createCertificate(
    form,
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

Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} certificate form tests`, () => {
    test.beforeEach(async ({ page }) => {
      const form = new CertificateFormModel(page, exam)
      await form.showKeys()
      await form.gotoNew()
    })

    test(`can create, update and delete a new published ${exam} certificate`, async ({ page, context }) =>
      await createPublishedAndUpdateAndDelete(new CertificateFormModel(page, exam), context))

    test(`can create, update and delete a new draft ${exam} certificate`, async ({ page, context }) =>
      await createDraftAndUpdateAndDelete(new CertificateFormModel(page, exam), context))

    test(`can cancel ${exam} certificate creation`, async ({ page }) => await cancelCreatingCertificate(page))

    test(`can cancel ${exam} certificate update`, async ({ page, context }) =>
      await cancelUpdatingCertificate(new CertificateFormModel(page, exam), context))
  })
})
