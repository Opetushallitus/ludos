import { expect, Page, test } from '@playwright/test'
import { assertSuccessNotification, FormAction, loginTestGroup, Role } from '../../helpers'
import {
  assertAssignmentContentPage,
  AssignmentTextContent,
  contentIdFromContentPage,
  fillAssignmentForm
} from './assignmentHelpers'
import { Exam, PublishState } from 'web/src/types'
import {
  AnyAssignmentFormType,
  LdAssignmentFormType,
  PuhviAssignmentFormType,
  SukoAssignmentFormType
} from 'web/src/components/forms/schemas/assignmentSchema'

const createAssignmentFormDataByExam = {
  [Exam.SUKO]: {
    exam: Exam.SUKO,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä SUKO',
    nameSv: 'Testuppgift SUKO',
    instructionFi: 'Testiohje SUKO',
    instructionSv: 'Testinstruktioner SUKO',
    contentFi: ['Testisisältö SUKO'],
    contentSv: ['Testinnehåll SUKO'],
    laajaalainenOsaaminenKoodiArvos: ['01', '06', '02'],
    assignmentTypeKoodiArvo: '001',
    oppimaara: {
      oppimaaraKoodiArvo: 'VKA1',
      kielitarjontaKoodiArvo: null
    },
    tavoitetasoKoodiArvo: '0002',
    aiheKoodiArvos: ['001', '002']
  } as SukoAssignmentFormType,
  [Exam.LD]: {
    exam: Exam.LD,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä LD',
    nameSv: 'Testuppgift LD',
    instructionFi: 'Testiohjeet LD',
    instructionSv: 'Testinstruktioner LD',
    contentFi: ['Testisisältö LD 1', 'Testisisältö LD 2'],
    contentSv: ['Testinnehåll LD 1', 'Testinnehåll LD 2'],
    laajaalainenOsaaminenKoodiArvos: ['05'],
    lukuvuosiKoodiArvos: ['20202021'],
    aineKoodiArvo: '1'
  } as LdAssignmentFormType,
  [Exam.PUHVI]: {
    exam: Exam.PUHVI,
    publishState: PublishState.Published,
    nameFi: 'Testitehtävä PUHVI',
    nameSv: 'Testuppgift PUHVI',
    instructionFi: 'Testiohje PUHVI',
    instructionSv: 'Testinstruktioner PUHVI',
    contentFi: ['Testisisältö PUHVI'],
    contentSv: ['Testinnehåll PUHVI'],
    laajaalainenOsaaminenKoodiArvos: ['05'],
    lukuvuosiKoodiArvos: ['20202021'],
    assignmentTypeKoodiArvo: '002'
  } as PuhviAssignmentFormType
}

const updateAssignmentFormDataByExam = {
  [Exam.SUKO]: {
    ...createAssignmentFormDataByExam[Exam.SUKO],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.SUKO]),
    assignmentTypeKoodiArvo: '002',
    oppimaara: {
      oppimaaraKoodiArvo: 'VKA1',
      kielitarjontaKoodiArvo: 'SA'
    },
    tavoitetasoKoodiArvo: '0003',
    aiheKoodiArvos: ['003']
  } as SukoAssignmentFormType,
  [Exam.LD]: {
    ...createAssignmentFormDataByExam[Exam.LD],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.LD]),
    laajaalainenOsaaminenKoodiArvos: ['01', '02']
  } as LdAssignmentFormType,
  [Exam.PUHVI]: {
    ...createAssignmentFormDataByExam[Exam.PUHVI],
    ...appendMuokattuToTextFields(createAssignmentFormDataByExam[Exam.PUHVI]),
    laajaalainenOsaaminenKoodiArvos: ['01', '02']
  } as PuhviAssignmentFormType
}

function formDataForCreate(exam: Exam, action: 'submit' | 'draft'): AnyAssignmentFormType {
  const createFormData = createAssignmentFormDataByExam[exam]
  createFormData.publishState = action === 'submit' ? PublishState.Published : PublishState.Draft
  return createFormData as AnyAssignmentFormType
}

function formDataForUpdate(exam: Exam, action: 'submit' | 'draft') {
  const updateFormData = updateAssignmentFormDataByExam[exam]
  updateFormData.publishState = action === 'submit' ? PublishState.Published : PublishState.Draft
  return updateFormData
}

function appendMuokattuToTextFields(assignmentTextContent: AssignmentTextContent): AssignmentTextContent {
  return {
    nameFi: `${assignmentTextContent.nameFi} muokattu`,
    nameSv: `${assignmentTextContent.nameSv} updaterad`,
    instructionFi: `${assignmentTextContent.instructionFi} muokattu`,
    instructionSv: `${assignmentTextContent.instructionSv} updaterad`,
    contentFi: assignmentTextContent.contentFi.map((s) => `${s} muokattu`),
    contentSv: assignmentTextContent.contentSv.map((s) => `${s} updaterad`)
  }
}

loginTestGroup(test, Role.YLLAPITAJA)

async function clickFormAction(page: Page, action: FormAction) {
  await page.getByTestId(`form-${action}`).click()
}

async function changeAssignmentPublishState(page: Page, action: FormAction) {
  await page.getByTestId(`edit-content-btn`).click()
  await clickFormAction(page, action)
}

async function navigateToAssignmentUpdateFormAndAssertDataLoaded(page: Page, expectedFormData: AnyAssignmentFormType) {
  // TODO: metadata
  await page.getByTestId('edit-content-btn').click()
  await expect(page.getByTestId('heading')).toHaveText(expectedFormData.nameFi)

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

async function cancelAssignmentCreation(page: Page) {
  await clickFormAction(page, 'cancel')
  await expect(page.getByTestId('create-koetehtava-button')).toBeVisible()
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

Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} assignment form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
      await page.getByTestId('create-koetehtava-button').click()
    })

    test(`can create, update and delete published assignment`, async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(page, exam, 'submit'))

    test(`can create, update and delete draft assignment`, async ({ page }) =>
      await createAndUpdateAndDeleteAssignment(page, exam, 'draft'))

    test(`can cancel assignment creation`, async ({ page }) => await cancelAssignmentCreation(page))
  })
})
