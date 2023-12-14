import { expect, Page, test } from '@playwright/test'
import { assertInputValues, assertSuccessNotification, FormAction, loginTestGroup, Role } from '../../helpers'
import {
  assertAssignmentContentPage,
  contentIdFromContentPage,
  fillAssignmentForm,
  formDataForCreate,
  formDataForUpdate
} from './assignmentHelpers'
import { Exam, oppimaaraId } from 'web/src/types'
import {
  AnyAssignmentFormType,
  isLdAssignmentFormType,
  isPuhviAssignmentFormType,
  isSukoAssignmentFormType
} from 'web/src/components/forms/schemas/assignmentSchema'
import { FormModel } from '../../models/FormModel'

async function clickFormAction(page: Page, action: FormAction) {
  await page.getByTestId(`form-${action}`).click()
}

async function changeAssignmentPublishState(page: Page, action: FormAction) {
  await page.getByTestId(`edit-content-btn`).click()
  await clickFormAction(page, action)
}

async function navigateToAssignmentUpdateFormAndAssertDataLoaded(page: Page, expectedFormData: AnyAssignmentFormType) {
  await page.getByTestId('edit-content-btn').click()
  await expect(page.getByTestId('heading')).toHaveText(expectedFormData.nameFi)

  if (isSukoAssignmentFormType(expectedFormData)) {
    await assertInputValues(page, 'oppimaara', [oppimaaraId(expectedFormData.oppimaara)])
    await expect(page.getByTestId(`assignmentTypeRadio-${expectedFormData.assignmentTypeKoodiArvo}`)).toBeChecked()
    if (expectedFormData.tavoitetasoKoodiArvo) {
      await assertInputValues(page, 'tavoitetaso', [expectedFormData.tavoitetasoKoodiArvo])
    }
    await assertInputValues(page, 'aihe', expectedFormData.aiheKoodiArvos)
  } else if (isLdAssignmentFormType(expectedFormData)) {
    await assertInputValues(page, 'lukuvuosiKoodiArvos', expectedFormData.lukuvuosiKoodiArvos)
    await assertInputValues(page, 'aineKoodiArvo', [expectedFormData.aineKoodiArvo])
  } else if (isPuhviAssignmentFormType(expectedFormData)) {
    await assertInputValues(page, 'lukuvuosiKoodiArvos', expectedFormData.lukuvuosiKoodiArvos)
    await expect(page.getByTestId(`assignmentTypeRadio-${expectedFormData.assignmentTypeKoodiArvo}`)).toBeChecked()
  } else {
    throw new Error(`Unsupported type for expectedFormData ${expectedFormData}`)
  }
  await assertInputValues(page, 'laajaalainenOsaaminenKoodiArvos', expectedFormData.laajaalainenOsaaminenKoodiArvos)

  await expect(page.getByTestId('nameFi')).toHaveValue(expectedFormData.nameFi)
  await expect(page.getByTestId('instructionFi')).toHaveValue(expectedFormData.instructionFi)
  for (const i of expectedFormData.contentFi.keys()) {
    await expect(page.getByTestId(`contentFi-${i}`)).toContainText(expectedFormData.contentFi[i])
  }

  if (expectedFormData.exam !== Exam.SUKO) {
    await page.getByTestId('tab-sv').click()
    await expect(page.getByTestId('nameSv')).toHaveValue(expectedFormData.nameSv)
    await expect(page.getByTestId('instructionSv')).toHaveValue(expectedFormData.instructionSv)
    for (const i of expectedFormData.contentSv.keys()) {
      await expect(page.getByTestId(`contentSv-${i}`)).toContainText(expectedFormData.contentSv[i])
    }
    await page.getByTestId('tab-fi').click()
  }
}

async function createAndUpdateAndDeleteAssignment(page: Page, exam: Exam, createAction: 'submit' | 'draft') {
  // Create
  const createFormData = formDataForCreate(exam, createAction)
  await fillAssignmentForm(page, createFormData)
  await clickFormAction(page, createAction)
  await assertSuccessNotification(
    page,
    createAction === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )
  const assignmentId = await contentIdFromContentPage(page)
  await assertAssignmentContentPage(page, createFormData)

  // Update
  const updateFormData = formDataForUpdate(exam, createAction)
  await navigateToAssignmentUpdateFormAndAssertDataLoaded(page, createFormData)
  await fillAssignmentForm(page, updateFormData)
  await clickFormAction(page, createAction)
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentContentPage(page, updateFormData)

  // Test state change notifications
  if (createAction === 'submit') {
    await changeAssignmentPublishState(page, 'draft')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
    await changeAssignmentPublishState(page, 'submit')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  } else {
    await changeAssignmentPublishState(page, 'submit')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
    await changeAssignmentPublishState(page, 'draft')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  }

  await deleteAssignment(page, exam, assignmentId)
}

async function deleteAssignment(page: Page, exam: Exam, assignmentId: number) {
  await page.getByTestId('edit-content-btn').click()

  await page.getByTestId('form-delete').click()
  await page.getByTestId('modal-button-delete').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-poisto.onnistui')

  // expect not to find the deleted assignment from list
  await expect(page.getByTestId(`assignment-${assignmentId}`)).toBeHidden()

  await page.goto(`/${exam.toLowerCase()}/koetehtavat/${assignmentId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} assignment form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await new FormModel(page, exam).showKeys()
      await page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
      await page.getByTestId('create-koetehtava-button').click()
    })

    test('can create published, update and delete', async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(page, exam, 'submit'))

    test('can create draft, update and delete', async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(page, exam, 'draft'))
  })
})
