import { expect, Page, test } from '@playwright/test'
import { assertSuccessNotification, examsLowerCase, FormAction, loginTestGroup, Role } from '../../helpers'
import {
  assertLdAssignmentContentPage,
  assertPuhviAssignmentContentPage,
  assertSukoAssignmentContentPage,
  AssignmentTextContent,
  contentIdFromContentPage,
  fillLdAssignmentForm,
  fillPuhviAssignmentForm,
  fillSukoAssignmentForm
} from './assignmentHelpers'
import { Exam, PublishState } from 'web/src/types'
import {
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

function createFormData(exam: Exam, action: 'submit' | 'draft') {
  const createFormData = createAssignmentFormDataByExam[exam]
  createFormData.publishState = action === 'submit' ? PublishState.Published : PublishState.Draft
  return createFormData
}

function updateFormData(exam: Exam, action: 'submit' | 'draft') {
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

async function createAndAssertSukoAssignment(page: Page, action: 'submit' | 'draft') {
  const formData = createFormData(Exam.SUKO, action) as SukoAssignmentFormType

  await fillSukoAssignmentForm(page, formData)

  await page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()
  await assertSuccessNotification(
    page,
    action === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )

  const createdAssignmentId = await contentIdFromContentPage(page)
  await assertSukoAssignmentContentPage(page, formData)
  return createdAssignmentId
}

async function changeAssignmentPublishState(page: Page, action: FormAction) {
  await page.getByTestId(`edit-content-btn`).click()
  await page.getByTestId(`form-update-${action}`).click()
}

async function assertPublishedAssignmentStateChanges(
  page: Page,
  assertUpdatedAssignment: (page: Page) => Promise<void>
) {
  await page.getByTestId('form-update-submit').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertUpdatedAssignment(page)

  await changeAssignmentPublishState(page, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')

  await changeAssignmentPublishState(page, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')

  await changeAssignmentPublishState(page, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
}

async function assertDraftAssignmentStateChanges(page: Page, assertUpdatedAssignment: (page: Page) => Promise<void>) {
  await page.getByTestId('form-update-draft').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertUpdatedAssignment(page)

  await changeAssignmentPublishState(page, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')

  await changeAssignmentPublishState(page, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')

  await changeAssignmentPublishState(page, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
}

async function navigateToAssignmentUpdateFormAndAssertDataLoaded(
  page: Page,
  exam: Exam,
  expectedAssignmentTextContent: AssignmentTextContent
) {
  // TODO: metadata
  await page.getByTestId('edit-content-btn').click()
  await expect(page.getByTestId('heading')).toHaveText(expectedAssignmentTextContent.nameFi)

  await expect(page.getByTestId('nameFi')).toHaveValue(expectedAssignmentTextContent.nameFi)
  await expect(page.getByTestId('instructionFi')).toHaveValue(expectedAssignmentTextContent.instructionFi)
  for (const i of expectedAssignmentTextContent.contentFi.keys()) {
    await expect(page.getByTestId(`contentFi-${i}`)).toContainText(expectedAssignmentTextContent.contentFi[i])
  }

  if (exam !== Exam.SUKO) {
    await page.getByTestId('tab-sv').click()
    await expect(page.getByTestId('nameSv')).toHaveValue(expectedAssignmentTextContent.nameSv)
    await expect(page.getByTestId('instructionSv')).toHaveValue(expectedAssignmentTextContent.instructionSv)
    for (const i of expectedAssignmentTextContent.contentSv.keys()) {
      await expect(page.getByTestId(`contentSv-${i}`)).toContainText(expectedAssignmentTextContent.contentSv[i])
    }
    await page.getByTestId('tab-fi').click()
  }
}

async function createAndUpdateAndDeleteSukoAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createAndAssertSukoAssignment(page, action)

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(page, Exam.SUKO, createFormData(Exam.SUKO, action))

  await fillSukoAssignmentForm(page, updateFormData(Exam.SUKO, action) as SukoAssignmentFormType)

  const assertUpdatedAssignment = (page: Page) => {
    return assertSukoAssignmentContentPage(page, updateFormData(Exam.SUKO, action) as SukoAssignmentFormType)
  }
  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(page, assertUpdatedAssignment)
  } else {
    await assertDraftAssignmentStateChanges(page, assertUpdatedAssignment)
  }

  await deleteAssignment(page, 'suko', createdAssignmentId)
}

async function createAndAssertLdAssignment(page: Page, action: 'submit' | 'draft') {
  const formData = createFormData(Exam.LD, action) as LdAssignmentFormType
  await fillLdAssignmentForm(page, formData)

  await page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await contentIdFromContentPage(page)
  await assertLdAssignmentContentPage(page, formData)

  return createdAssignmentId
}

async function createAndUpdateAndDeleteLdAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createAndAssertLdAssignment(page, action)

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(page, Exam.LD, createFormData(Exam.LD, action))

  await fillLdAssignmentForm(page, updateFormData(Exam.LD, action) as LdAssignmentFormType)

  const assertUpdatedAssignment = (page: Page) => {
    return assertLdAssignmentContentPage(page, updateFormData(Exam.LD, action) as LdAssignmentFormType)
  }
  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(page, assertUpdatedAssignment)
  } else {
    await assertDraftAssignmentStateChanges(page, assertUpdatedAssignment)
  }

  await deleteAssignment(page, 'ld', createdAssignmentId)
}

async function createAndAssertPuhviAssignment(page: Page, action: FormAction) {
  await fillPuhviAssignmentForm(page, createAssignmentFormDataByExam[Exam.PUHVI])

  await page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()
  await assertSuccessNotification(
    page,
    action === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )
  await expect(page.getByTestId('assignment-header')).toHaveText(createAssignmentFormDataByExam[Exam.PUHVI].nameFi)

  return await contentIdFromContentPage(page)
}

async function createAndUpdateDeletePuhviAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createAndAssertPuhviAssignment(page, action)

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(page, Exam.PUHVI, createFormData(Exam.PUHVI, action))

  await fillPuhviAssignmentForm(page, updateFormData(Exam.PUHVI, action) as PuhviAssignmentFormType)

  const assertUpdatedAssignment = (page: Page) => {
    return assertPuhviAssignmentContentPage(page, updateFormData(Exam.PUHVI, action) as PuhviAssignmentFormType)
  }
  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(page, assertUpdatedAssignment)
  } else {
    await assertDraftAssignmentStateChanges(page, assertUpdatedAssignment)
  }

  await deleteAssignment(page, 'puhvi', createdAssignmentId)
}

async function cancelAssignmentCreation(page: Page) {
  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')

  await btn.click()
  page.getByTestId('create-koetehtava-button')
}

async function deleteAssignment(page: Page, exam: LowerCaseExam, assignmentId: number) {
  await page.getByTestId('edit-content-btn').click()

  await page.getByTestId('form-delete').click()
  await page.getByTestId('modal-button-delete').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-poisto.onnistui')

  // expect not to find the deleted assignment from list
  await expect(page.getByTestId(`assignment-${assignmentId}`)).toBeHidden()

  await page.goto(`/${exam}/koetehtavat/${assignmentId}`)
  await expect(page.getByText('404', { exact: true })).toBeVisible()
}

type ExamTest = {
  publishTest: (page: Page) => Promise<void>
  draftTest: (page: Page) => Promise<void>
}
type LowerCaseExam = `${Lowercase<Exam>}`

const testsByExam: Record<LowerCaseExam, ExamTest> = {
  suko: {
    publishTest: (page: Page) => createAndUpdateAndDeleteSukoAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateAndDeleteSukoAssignment(page, 'draft')
  },
  ld: {
    publishTest: (page: Page) => createAndUpdateAndDeleteLdAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateAndDeleteLdAssignment(page, 'draft')
  },
  puhvi: {
    publishTest: (page: Page) => createAndUpdateDeletePuhviAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateDeletePuhviAssignment(page, 'draft')
  }
}

examsLowerCase.forEach((examStr) => {
  const exam = examStr as LowerCaseExam

  test.describe(`${exam} assignment form tests`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId('header-language-dropdown-expand').click()
      await page.getByText('Näytä avaimet').click()
      await page.getByTestId(`nav-link-${exam}`).click()
      await page.getByTestId('create-koetehtava-button').click()
    })

    test(`can create, update and delete published assignment`, async ({ page }) =>
      await testsByExam[exam].publishTest(page))

    test(`can create, update and delete draft assignment`, async ({ page }) => await testsByExam[exam].draftTest(page))

    test(`can cancel ${exam} assignment creation`, async ({ page }) => await cancelAssignmentCreation(page))
  })
})
