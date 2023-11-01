import { expect, Page, test } from '@playwright/test'
import {
  assertSuccessNotification,
  examsLowerCase,
  FormAction,
  loginTestGroup,
  Role,
  setTeachingLanguage
} from '../../helpers'
import {
  assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage,
  AssignmentTextContent,
  fillLdAssignmentForm,
  fillPuhviAssignmentForm,
  fillSukoAssignmentForm
} from './assignmentHelpers'
import { Exam, PublishState, TeachingLanguage } from 'web/src/types'
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

async function getAssignmentIdFromResponse(page: Page): Promise<number> {
  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/assignment/') && response.ok()
  )

  return (await response.json()).id
}

loginTestGroup(test, Role.YLLAPITAJA)

async function createAndAssertSukoAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillSukoAssignmentForm(page, createAssignmentFormDataByExam[Exam.SUKO])

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(createAssignmentFormDataByExam[Exam.SUKO].nameFi)
  await expect(page.getByTestId('suko-oppimaara')).toHaveText('Vieraat kielet, A-oppimäärä')
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function assertUpdatedSukoAssignment(
  page: Page,
  updatedAssignmentTextContent: AssignmentTextContent,
  createdAssignmentId: number,
  action: FormAction
) {
  const updatedAssignmentHeader = page.getByTestId('assignment-header')

  await expect(updatedAssignmentHeader).toHaveText(updatedAssignmentTextContent.nameFi)
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')

  const expectedOppimaara = 'Vieraat kielet, A-oppimäärä, saksan kieli'
  await expect(page.getByTestId('suko-oppimaara')).toHaveText(expectedOppimaara)
  await expect(page.getByTestId('suko-tehtavatyyppi')).toHaveText('Tekstin tiivistäminen')
  // await expect(page.getByTestId('suko-tavoitetaso')).toBeVisible()
  await expect(page.getByTestId('suko-aihe')).toHaveText('kulttuuri ja luova ilmaisu')
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
    'Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, Vuorovaikutusosaaminen'
  )

  await expect(page.locator('#languageDropdown')).toBeHidden()

  await page.getByTestId('return').click()
  const assignmentCard = page.getByTestId(`assignment-list-item-${createdAssignmentId}`)
  await expect(assignmentCard).toBeVisible()
  await expect(assignmentCard.getByTestId('suko-oppimaara')).toHaveText(expectedOppimaara)

  await expect(page.locator('#languageDropdown')).toBeHidden()
}

async function assertUpdatedLdAssignment(
  page: Page,
  updatedAssignmentTextContent: AssignmentTextContent,
  createdAssignmentId: number,
  action: FormAction
) {
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await setTeachingLanguage(page, TeachingLanguage.fi)
  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedAssignmentTextContent.nameFi)
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
  await assertCommonBetweenLdAndPuhvi(page, updatedAssignmentTextContent, createdAssignmentId)
}

async function assertUpdatedPuhviAssignment(
  page: Page,
  updatedAssignmentTextContent: AssignmentTextContent,
  createdAssignmentId: number,
  action: FormAction
) {
  await setTeachingLanguage(page, TeachingLanguage.fi)
  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedAssignmentTextContent.nameFi)
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await assertCommonBetweenLdAndPuhvi(page, updatedAssignmentTextContent, createdAssignmentId)
}

async function changeAssignmentPublishState(page: Page, createdAssignmentId: number, action: FormAction) {
  await page.getByTestId(`assignment-${createdAssignmentId}-edit`).click()
  await page.getByTestId(`form-update-${action}`).click()
}

async function assertPublishedAssignmentStateChanges(
  page: Page,
  updatedAssignmentTextContent: AssignmentTextContent,
  assertAssignmentFn: (page: Page, data: any, assignmentId: number, action: FormAction) => Promise<void>,
  createdAssignmentId: number
) {
  await page.getByTestId('form-update-submit').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'submit')

  await changeAssignmentPublishState(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'draft')

  await changeAssignmentPublishState(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'draft')

  await changeAssignmentPublishState(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'submit')
}

async function assertDraftAssignmentStateChanges(
  page: Page,
  updatedAssignmentTextContent: AssignmentTextContent,
  assertAssignmentFn: (page: Page, data: any, assignmentId: number, action: FormAction) => Promise<void>,
  createdAssignmentId: number
) {
  await page.getByTestId('form-update-draft').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'draft')

  await changeAssignmentPublishState(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'submit')

  await changeAssignmentPublishState(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'submit')

  await changeAssignmentPublishState(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  await assertAssignmentFn(page, updatedAssignmentTextContent, createdAssignmentId, 'draft')
}

async function navigateToAssignmentUpdateFormAndAssertDataLoaded(
  page: Page,
  assignmentId: number,
  exam: Exam,
  expectedAssignmentTextContent: AssignmentTextContent
) {
  await page.getByTestId(`assignment-list-item-${assignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${assignmentId.toString()}-edit`).click()
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

async function createAndUpdateSukoAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createAndAssertSukoAssignment(
    page,
    action,
    action === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(
    page,
    createdAssignmentId,
    Exam.SUKO,
    createAssignmentFormDataByExam[Exam.SUKO]
  )

  const updateFormData = updateAssignmentFormDataByExam[Exam.SUKO]
  await fillSukoAssignmentForm(page, updateFormData)

  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(page, updateFormData, assertUpdatedSukoAssignment, createdAssignmentId)
  } else {
    await assertDraftAssignmentStateChanges(page, updateFormData, assertUpdatedSukoAssignment, createdAssignmentId)
  }

  await deleteAssignment(page, 'suko', createdAssignmentId)
}

async function assertCommonBetweenLdAndPuhvi(
  page: Page,
  assignmentTextContent: AssignmentTextContent,
  createdAssignmentId: number
) {
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Hyvinvointiosaaminen, Vuorovaikutusosaaminen')

  for (const [i, content] of assignmentTextContent.contentFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(assignmentTextContent.nameSv)
  for (const [i, content] of assignmentTextContent.contentSv.entries()) {
    await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
  }

  await assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
    page,
    createdAssignmentId,
    assignmentTextContent.nameSv
  )
}

async function createAndAssertLdAssignment(page: Page, action: FormAction) {
  let createdAssignmentId: number

  const formData = createAssignmentFormDataByExam[Exam.LD]
  await fillLdAssignmentForm(page, formData)

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  createdAssignmentId = await getAssignmentIdFromResponse(page)

  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameFi)
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Eettisyys ja ympäristöosaaminen')
  await expect(page.getByTestId('instruction-fi')).toHaveText(formData.instructionFi)
  for (const [i, content] of formData.contentFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameSv)
  await expect(page.getByTestId('instruction-sv')).toHaveText(formData.instructionSv)
  for (const [i, content] of formData.contentSv.entries()) {
    await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
  }

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function createLdAssignmentAndFillUpdateForm(page: Page, action: 'submit' | 'draft' | 'cancel' | 'delete') {
  const createdAssignmentId = await createAndAssertLdAssignment(page, action)

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(
    page,
    createdAssignmentId,
    Exam.LD,
    createAssignmentFormDataByExam[Exam.LD]
  )

  await fillLdAssignmentForm(page, updateAssignmentFormDataByExam[Exam.LD])
  return createdAssignmentId
}

async function createAndUpdateLdAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createLdAssignmentAndFillUpdateForm(page, action)
  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(
      page,
      updateAssignmentFormDataByExam[Exam.LD],
      assertUpdatedLdAssignment,
      createdAssignmentId
    )
  } else {
    await assertDraftAssignmentStateChanges(
      page,
      updateAssignmentFormDataByExam[Exam.LD],
      assertUpdatedLdAssignment,
      createdAssignmentId
    )
  }
  await deleteAssignment(page, 'ld', createdAssignmentId)
}

async function createAndAssertPuhviAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillPuhviAssignmentForm(page, createAssignmentFormDataByExam[Exam.PUHVI])

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(createAssignmentFormDataByExam[Exam.PUHVI].nameFi)

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function createAndUpdatePuhviAssignment(page: Page, action: 'submit' | 'draft') {
  const createdAssignmentId = await createAndAssertPuhviAssignment(
    page,
    action,
    action === 'submit'
      ? 'form.notification.tehtavan-tallennus.julkaisu-onnistui'
      : 'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )

  await navigateToAssignmentUpdateFormAndAssertDataLoaded(
    page,
    createdAssignmentId,
    Exam.PUHVI,
    createAssignmentFormDataByExam[Exam.PUHVI]
  )

  const updateFormData = updateAssignmentFormDataByExam[Exam.PUHVI]
  await fillPuhviAssignmentForm(page, updateFormData)

  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(page, updateFormData, assertUpdatedPuhviAssignment, createdAssignmentId)
  } else {
    await assertDraftAssignmentStateChanges(page, updateFormData, assertUpdatedPuhviAssignment, createdAssignmentId)
  }
  await deleteAssignment(page, 'puhvi', createdAssignmentId)
}

async function cancelAssignmentCreation(page: Page) {
  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')

  await btn.click()
  page.getByTestId('create-koetehtava-button')
}

async function cancelAssignmentUpdate(page: Page, exam: string) {
  let createdAssignmentId

  if (exam === 'suko') {
    createdAssignmentId = await createAndAssertSukoAssignment(
      page,
      'draft',
      'form.notification.tehtavan-tallennus.luonnos-onnistui'
    )
  } else if (exam === 'ld') {
    createdAssignmentId = await createAndAssertLdAssignment(page, 'draft')
  } else {
    createdAssignmentId = await createAndAssertPuhviAssignment(
      page,
      'draft',
      'form.notification.tehtavan-tallennus.luonnos-onnistui'
    )
  }

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')

  await btn.click()
  page.getByTestId('create-koetehtava-button')
}

async function deleteAssignment(page: Page, exam: LowerCaseExam, assignmentId: number) {
  await page.getByTestId(`assignment-${assignmentId.toString()}-edit`).click()

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
    publishTest: (page: Page) => createAndUpdateSukoAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateSukoAssignment(page, 'draft')
  },
  ld: {
    publishTest: (page: Page) => createAndUpdateLdAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateLdAssignment(page, 'draft')
  },
  puhvi: {
    publishTest: (page: Page) => createAndUpdatePuhviAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdatePuhviAssignment(page, 'draft')
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

    test(`can create, update and delete ${exam} published assignment`, async ({ page }) =>
      await testsByExam[exam].publishTest(page))

    test(`can create, update and delete ${exam} draft assignment`, async ({ page }) =>
      await testsByExam[exam].draftTest(page))

    test(`can cancel ${exam} assignment creation`, async ({ page }) => await cancelAssignmentCreation(page))

    test(`can cancel ${exam} assignment update`, async ({ page }) => await cancelAssignmentUpdate(page, exam))
  })
})
