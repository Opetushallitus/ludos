import { BrowserContext, expect, test } from '@playwright/test'
import {
  assertSuccessNotification,
  FormAction,
  loginTestGroup,
  Role,
  selectAttachmentFile,
  setSingleSelectDropdownOption
} from '../../helpers'
import { ContentType, Exam } from 'web/src/types'
import { assertContentPage, fillCertificateForm } from '../../examHelpers/certificateHelpers'
import { CertificateFormModel } from '../../models/CertificateFormModel'
import { isLdCertificateValues, isPuhviCertificateValues } from 'web/src/components/forms/schemas/certificateSchema'

async function createCertificate(
  form: CertificateFormModel,
  context: BrowserContext,
  action: FormAction,
  expectedNotification: string
) {
  const { page } = form
  const formData = form.createFormData(action)

  await form.assertNavigationNoBlockOnCleanForm()
  await fillCertificateForm(form, formData)
  await form.assertNavigationBlockOnDirtyForm()

  await form.submitCertificate(action)

  const responseFromClick = await page.waitForResponse(
    (response) => response.url().includes('/api/certificate') && response.ok()
  )

  const responseData = await responseFromClick.json()

  await assertSuccessNotification(page, expectedNotification)
  await assertContentPage(page, context, formData, action)

  return { id: responseData.id, nameFromCreate: formData.nameFi }
}

async function updateCertificate(
  form: CertificateFormModel,
  context: BrowserContext,
  expectedCurrentName: string,
  action: FormAction,
  expectedNotification: string
) {
  const { page } = form
  await expect(form.formHeader).toBeVisible()

  await form.editContentButton.click()

  await expect(form.heading).toHaveText(expectedCurrentName)
  await form.assertNavigationNoBlockOnCleanForm()
  await expect(form.heading).toHaveText(expectedCurrentName)

  const inputs = { ...form.updateCertificateInputs(action), nameFi: `${expectedCurrentName} updated` }

  await fillCertificateForm(form, inputs)

  if (action === 'submit') {
    await form.assertNavigationBlockOnDirtyForm()
    await form.submitButton.click()
  } else if (action === 'draft') {
    await form.draftButton.click()
  }
  await assertSuccessNotification(page, expectedNotification)
  await assertContentPage(page, context, inputs, action)

  return inputs.nameFi
}

async function deleteCertificate(form: CertificateFormModel, certificateId: number) {
  await expect(form.formHeader).toBeVisible()

  await form.editContentButton.click()
  await form.deleteButton.click()
  await form.modalDeleteButton.click()

  await assertSuccessNotification(form.page, 'todistuksen-poisto.onnistui')
  // expect not to find the deleted certificate from a list
  await expect(form.page.getByTestId(`certificate-${certificateId}`)).toBeHidden()

  await form.goToContentPage(ContentType.todistukset, certificateId)
  await expect(form.page.getByText('404', { exact: true })).toBeVisible()
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

async function cancelCreatingCertificate(form: CertificateFormModel) {
  const btn = form.cancelButton
  await expect(btn).toHaveText('button.peruuta')
  await btn.click()
  await expect(form.createNewCertificateButton).toBeVisible()
}

async function cancelUpdatingCertificate(form: CertificateFormModel, context: BrowserContext) {
  const { nameFromCreate } = await createCertificate(
    form,
    context,
    'submit',
    'form.notification.todistuksen-tallennus.julkaisu-onnistui'
  )

  await expect(form.formHeader).toBeVisible()
  await form.editContentButton.click()
  await expect(form.heading).toHaveText(nameFromCreate)

  await form.cancelButton.click()
  await expect(form.formHeader).toBeVisible()
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

    test(`can cancel ${exam} certificate creation`, async ({ page }) =>
      await cancelCreatingCertificate(new CertificateFormModel(page, exam)))

    test(`can cancel ${exam} certificate update`, async ({ page, context }) =>
      await cancelUpdatingCertificate(new CertificateFormModel(page, exam), context))

    test('form validations work', async ({ page }) => {
      const form = new CertificateFormModel(page, exam)
      const formData = form.createFormData('submit')

      await form.submitButton.click()
      await expect(form.formErrorMsgList).toBeVisible()

      if (isLdCertificateValues(formData)) {
        await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgAineKoodiArvo, () =>
          setSingleSelectDropdownOption(page, 'aineKoodiArvo', formData.aineKoodiArvo)
        )
      }

      await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgNameFi, () => form.nameFi.fill(formData.nameFi))

      await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgAttachmentFi, () =>
        selectAttachmentFile(page, formData.attachmentFi.name!, form.attachmentInputFi)
      )

      if (!isLdCertificateValues(formData)) {
        await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgDescriptionFi, () =>
          form.descriptionFi.fill(formData.descriptionFi)
        )
      }

      if (isPuhviCertificateValues(formData) || isLdCertificateValues(formData)) {
        await form.tabSv.click()
        await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgNameSv, () => form.nameSv.fill(formData.nameSv))

        if (isPuhviCertificateValues(formData)) {
          await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgDescriptionSv, () =>
            form.descriptionSv.fill(formData.descriptionSv)
          )
        }

        await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgAttachmentSv, () =>
          selectAttachmentFile(page, formData.attachmentSv.name!, form.attachmentInputSv)
        )
      }
    })
  })
})
