import { expect, Locator, test } from '@playwright/test'
import {
  assertInputValues,
  assertSuccessNotification,
  loginTestGroup,
  Role,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption
} from '../../helpers'
import {
  assertAssignmentContentPage,
  contentIdFromContentPage,
  createFormData,
  fillAssignmentForm,
  fillAssignmentType,
  fillLdAssignmentForm
} from '../../examHelpers/assignmentHelpers'
import { ContentType, Exam, oppimaaraId, TeachingLanguage } from 'web/src/types'
import {
  AnyAssignmentFormType,
  isLdAssignmentFormType,
  isPuhviAssignmentFormType,
  isSukoAssignmentFormType,
  LdAssignmentFormType,
  PuhviAssignmentFormType,
  SukoAssignmentFormType
} from 'web/src/components/forms/schemas/assignmentSchema'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'

async function navigateToAssignmentUpdateFormAndAssertDataLoaded(
  form: AssignmentFormModel,
  expectedFormData: AnyAssignmentFormType
) {
  const page = form.page

  await expect(form.heading).toHaveText(expectedFormData.nameFi)

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

  await expect(form.nameFi).toHaveValue(expectedFormData.nameFi)
  await expect(form.instructionFi).toHaveValue(expectedFormData.instructionFi)

  if (expectedFormData.contentFi) {
    for (const i of expectedFormData.contentFi.keys()) {
      await expect(page.getByTestId(`contentFi-${i}`)).toContainText(expectedFormData.contentFi[i])
    }
  }

  if (expectedFormData.exam !== Exam.SUKO) {
    await form.tabSv.click()
    await expect(form.nameSv).toHaveValue(expectedFormData.nameSv)
    await expect(form.instructionSv).toHaveValue(expectedFormData.instructionSv)
    if (expectedFormData.contentSv) {
      for (const i of expectedFormData.contentSv.keys()) {
        await expect(page.getByTestId(`contentSv-${i}`)).toContainText(expectedFormData.contentSv[i])
      }
    }
    await form.tabFi.click()
  }
}

async function createAndUpdateAndDeleteAssignment(form: AssignmentFormModel, createAction: 'submit' | 'draft') {
  const { page, exam } = form
  // Create
  const formData = createFormData(exam, createAction)
  await form.assertNavigationNoBlockOnCleanForm()
  await fillAssignmentForm(form, formData)
  await form.assertNavigationBlockOnDirtyForm()
  await form.clickFormAction(createAction)
  await assertSuccessNotification(
    page,
    createAction === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )
  const assignmentId = await contentIdFromContentPage(page)
  await assertAssignmentContentPage(page, formData)

  // Update
  const updateFormData = createFormData(exam, createAction, true)
  await form.editContentButton.click()
  await navigateToAssignmentUpdateFormAndAssertDataLoaded(form, formData)
  await form.assertNavigationNoBlockOnCleanForm()
  await navigateToAssignmentUpdateFormAndAssertDataLoaded(form, formData)
  await fillAssignmentForm(form, updateFormData)
  await form.assertNavigationBlockOnDirtyForm()
  await form.clickFormAction(createAction)
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentContentPage(page, updateFormData)

  // Test state change notifications
  if (createAction === 'submit') {
    await form.changeAssignmentPublishState('draft')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
    await form.changeAssignmentPublishState('submit')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  } else {
    await form.changeAssignmentPublishState('submit')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
    await form.changeAssignmentPublishState('draft')
    await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  }

  await deleteAssignment(form, assignmentId)
}

async function deleteAssignment(form: AssignmentFormModel, assignmentId: number) {
  const page = form.page

  await form.editContentButton.click()
  await form.deleteButton.click()
  await form.modalDeleteButton.click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-poisto.onnistui')
  // expect not to find the deleted assignment from list
  await expect(page.getByTestId(`assignment-${assignmentId}`)).toBeHidden()

  await form.goToContentPage(ContentType.ASSIGNMENT, assignmentId)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

async function validateAssignmentTypeField(
  form: AssignmentFormModel,
  formData: SukoAssignmentFormType | PuhviAssignmentFormType
) {
  await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgAssignmentType, () =>
    fillAssignmentType(form.page, formData)
  )
}

async function testSukoFormsRequiredFields(formData: SukoAssignmentFormType, form: AssignmentFormModel) {
  await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgOppimaara, () =>
    setSingleSelectDropdownOption(form.page, 'oppimaara', oppimaaraId(formData.oppimaara))
  )

  await validateAssignmentTypeField(form, formData)
}

async function testLdFormsRequiredFields(formData: LdAssignmentFormType, form: AssignmentFormModel) {
  await expect(form.formErrorMsgAineKoodiArvo).toBeVisible()
  await fillLdAssignmentForm(form, {
    aineKoodiArvo: formData.aineKoodiArvo
  })
  await expect(form.formErrorMsgAineKoodiArvo).toBeHidden()
}

async function fillAndCheckVisibility(
  field: Locator,
  expectedErrorMessageLocator: Locator,
  fillValue: string,
  errorShouldBeVisible: boolean
) {
  await field.fill(fillValue)
  if (errorShouldBeVisible) {
    await expect(expectedErrorMessageLocator).toBeVisible()
  } else {
    await expect(expectedErrorMessageLocator).toBeHidden()
  }
}

const toggleTabTo = (form: AssignmentFormModel) => async (to: TeachingLanguage) =>
  to === 'fi' ? form.tabFi.click() : form.tabSv.click()

async function testNameField(form: AssignmentFormModel) {
  const toggleTabToFn = toggleTabTo(form)

  await expect(form.formErrorMsgNameFi).toBeVisible()

  if (form.exam !== Exam.SUKO) {
    await toggleTabToFn('sv')
    await expect(form.formErrorMsgNameSv).toBeVisible()
    await toggleTabToFn('fi')
  }

  await fillAndCheckVisibility(form.nameFi, form.formErrorMsgNameFi, 'a', true)
  await fillAndCheckVisibility(form.nameFi, form.formErrorMsgNameFi, 'abc', false)

  if (form.exam !== Exam.SUKO) {
    await toggleTabToFn('sv')
    await expect(form.formErrorMsgNameSv).toBeHidden()
    await toggleTabToFn('fi')
    await form.nameFi.clear()
    await expect(form.formErrorMsgNameFi).toBeVisible()
    await toggleTabToFn('sv')
    await expect(form.formErrorMsgNameSv).toBeVisible()

    await fillAndCheckVisibility(form.nameSv, form.formErrorMsgNameSv, 'a', true)
    await fillAndCheckVisibility(form.nameSv, form.formErrorMsgNameSv, 'abc', false)

    await toggleTabToFn('sv')
    await expect(form.formErrorMsgNameFi).toBeHidden()
  }
}

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} assignment form tests`, () => {
    test.beforeEach(async ({ page }) => await new AssignmentFormModel(page, exam).initializeTest())

    test('can create published, update and delete', async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(new AssignmentFormModel(page, exam), 'submit'))

    test('can create draft, update and delete', async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(new AssignmentFormModel(page, exam), 'draft'))

    test('form validations work', async ({ page }) => {
      const form = new AssignmentFormModel(page, exam)
      const formData = createFormData(exam, 'submit')

      await form.submitButton.click()

      if (isSukoAssignmentFormType(formData)) {
        await testSukoFormsRequiredFields(formData, form)
      }

      if (isLdAssignmentFormType(formData) || isPuhviAssignmentFormType(formData)) {
        await form.fillFieldAndAssertErrorVisibility(form.formErrorMsgLukuvuosi, () =>
          setMultiSelectDropdownOptions(form.page, 'lukuvuosiKoodiArvos', formData.lukuvuosiKoodiArvos)
        )
      }

      if (isLdAssignmentFormType(formData)) {
        await testLdFormsRequiredFields(formData, form)
      }

      if (isPuhviAssignmentFormType(formData)) {
        await validateAssignmentTypeField(form, formData)
      }

      await form.submitButton.click()
      await testNameField(form)
    })
  })
})
