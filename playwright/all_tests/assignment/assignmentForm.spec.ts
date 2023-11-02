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
  fillLdAssignmentCreateForm,
  fillPuhviAssignmentCreateForm,
  fillSukoAssignmentCreateForm,
  fillLdAssignmentUpdateForm,
  fillPuhviAssignmentUpdateForm,
  fillSukoAssignmentUpdateForm,
  AssignmentTextContent
} from './assignmentHelpers'
import { Exam, TeachingLanguage } from 'web/src/types'

const createAssignmentTextContentByExam: Record<Exam, AssignmentTextContent> = {
  [Exam.SUKO]: {
    nameTextFi: 'Testitehtävä SUKO',
    nameTextSv: 'Testuppgift SUKO',
    instructionTextFi: 'Testiohje SUKO',
    instructionTextSv: 'Testinstruktioner SUKO',
    contentTextFi: ['Testisisältö SUKO'],
    contentTextSv: ['Testinnehåll SUKO']
  },
  [Exam.LD]: {
    nameTextFi: 'Testitehtävä LD',
    nameTextSv: 'Testuppgift LD',
    instructionTextFi: 'Testiohjeet LD',
    instructionTextSv: 'Testinstruktioner LD',
    contentTextFi: ['Testisisältö LD 1', 'Testisisältö LD 2'],
    contentTextSv: ['Testinnehåll LD 1', 'Testinnehåll LD 2']
  },
  [Exam.PUHVI]: {
    nameTextFi: 'Testitehtävä PUHVI',
    nameTextSv: 'Testuppgift PUHVI',
    instructionTextFi: 'Testiohje PUHVI',
    instructionTextSv: 'Testinstruktioner PUHVI',
    contentTextFi: ['Testisisältö PUHVI'],
    contentTextSv: ['Testinnehåll PUHVI']
  }
}

function appendMuokattuToTextContent(assignmentTextContent: AssignmentTextContent): AssignmentTextContent {
  return {
    nameTextFi: `${assignmentTextContent.nameTextFi} muokattu`,
    nameTextSv: `${assignmentTextContent.nameTextSv} updaterad`,
    instructionTextFi: `${assignmentTextContent.instructionTextFi} muokattu`,
    instructionTextSv: `${assignmentTextContent.instructionTextSv} updaterad`,
    contentTextFi: assignmentTextContent.contentTextFi.map((s) => `${s} muokattu`),
    contentTextSv: assignmentTextContent.contentTextSv.map((s) => `${s} updaterad`)
  }
}

const updateAssignmentTextContentByExam: Record<Exam, AssignmentTextContent> = {
  [Exam.SUKO]: appendMuokattuToTextContent(createAssignmentTextContentByExam[Exam.SUKO]),
  [Exam.LD]: appendMuokattuToTextContent(createAssignmentTextContentByExam[Exam.LD]),
  [Exam.PUHVI]: appendMuokattuToTextContent(createAssignmentTextContentByExam[Exam.PUHVI])
}

async function getAssignmentIdFromResponse(page: Page): Promise<number> {
  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/assignment/') && response.ok()
  )

  return (await response.json()).id
}

loginTestGroup(test, Role.YLLAPITAJA)

async function createAndAssertSukoAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillSukoAssignmentCreateForm(page, createAssignmentTextContentByExam[Exam.SUKO])

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(
    createAssignmentTextContentByExam[Exam.SUKO].nameTextFi
  )
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

  await expect(updatedAssignmentHeader).toHaveText(updatedAssignmentTextContent.nameTextFi)
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
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedAssignmentTextContent.nameTextFi)
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
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedAssignmentTextContent.nameTextFi)
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
  await expect(page.getByTestId('heading')).toHaveText(expectedAssignmentTextContent.nameTextFi)

  await expect(page.getByTestId('nameFi')).toHaveValue(expectedAssignmentTextContent.nameTextFi)
  await expect(page.getByTestId('instructionFi')).toHaveValue(expectedAssignmentTextContent.instructionTextFi)
  for (const i of expectedAssignmentTextContent.contentTextFi.keys()) {
    await expect(page.getByTestId(`contentFi-${i}`)).toContainText(expectedAssignmentTextContent.contentTextFi[i])
  }

  if (exam !== Exam.SUKO) {
    await page.getByTestId('tab-sv').click()
    await expect(page.getByTestId('nameSv')).toHaveValue(expectedAssignmentTextContent.nameTextSv)
    await expect(page.getByTestId('instructionSv')).toHaveValue(expectedAssignmentTextContent.instructionTextSv)
    for (const i of expectedAssignmentTextContent.contentTextSv.keys()) {
      await expect(page.getByTestId(`contentSv-${i}`)).toContainText(expectedAssignmentTextContent.contentTextSv[i])
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
    createAssignmentTextContentByExam[Exam.SUKO]
  )

  const updateTextContent = updateAssignmentTextContentByExam[Exam.SUKO]
  await fillSukoAssignmentUpdateForm(page, updateTextContent)

  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(
      page,
      updateTextContent,
      assertUpdatedSukoAssignment,
      createdAssignmentId
    )
  } else {
    await assertDraftAssignmentStateChanges(page, updateTextContent, assertUpdatedSukoAssignment, createdAssignmentId)
  }

  await deleteAssignment(page, 'suko', createdAssignmentId)
}

async function assertCommonBetweenLdAndPuhvi(
  page: Page,
  assignmentTextContent: AssignmentTextContent,
  createdAssignmentId: number
) {
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Hyvinvointiosaaminen, Vuorovaikutusosaaminen')

  for (const [i, content] of assignmentTextContent.contentTextFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(assignmentTextContent.nameTextSv)
  for (const [i, content] of assignmentTextContent.contentTextSv.entries()) {
    await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
  }

  await assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
    page,
    createdAssignmentId,
    assignmentTextContent.nameTextSv
  )
}

async function createAndAssertLdAssignment(page: Page, action: FormAction) {
  let createdAssignmentId: number

  const assignmentTextContent = createAssignmentTextContentByExam[Exam.LD]
  await fillLdAssignmentCreateForm(page, assignmentTextContent)

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  createdAssignmentId = await getAssignmentIdFromResponse(page)

  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await expect(page.getByTestId('assignment-header')).toHaveText(assignmentTextContent.nameTextFi)
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Eettisyys ja ympäristöosaaminen')
  await expect(page.getByTestId('instruction-fi')).toHaveText(assignmentTextContent.instructionTextFi)
  for (const [i, content] of assignmentTextContent.contentTextFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(assignmentTextContent.nameTextSv)
  await expect(page.getByTestId('instruction-sv')).toHaveText(assignmentTextContent.instructionTextSv)
  for (const [i, content] of assignmentTextContent.contentTextSv.entries()) {
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
    createAssignmentTextContentByExam[Exam.LD]
  )

  await fillLdAssignmentUpdateForm(page, updateAssignmentTextContentByExam[Exam.LD])
  return { createdAssignmentId, updatedAssignmentTextContent: updateAssignmentTextContentByExam[Exam.LD] }
}

async function createAndUpdateLdAssignment(page: Page, action: 'submit' | 'draft') {
  const { createdAssignmentId, updatedAssignmentTextContent } = await createLdAssignmentAndFillUpdateForm(page, action)
  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(
      page,
      updatedAssignmentTextContent,
      assertUpdatedLdAssignment,
      createdAssignmentId
    )
  } else {
    await assertDraftAssignmentStateChanges(
      page,
      updatedAssignmentTextContent,
      assertUpdatedLdAssignment,
      createdAssignmentId
    )
  }
  await deleteAssignment(page, 'ld', createdAssignmentId)
}

async function createAndAssertPuhviAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillPuhviAssignmentCreateForm(page, createAssignmentTextContentByExam[Exam.PUHVI])

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(
    createAssignmentTextContentByExam[Exam.PUHVI].nameTextFi
  )

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
    createAssignmentTextContentByExam[Exam.PUHVI]
  )

  const updateTextContent = updateAssignmentTextContentByExam[Exam.PUHVI]
  await fillPuhviAssignmentUpdateForm(page, updateTextContent)

  if (action === 'submit') {
    await assertPublishedAssignmentStateChanges(
      page,
      updateTextContent,
      assertUpdatedPuhviAssignment,
      createdAssignmentId
    )
  } else {
    await assertDraftAssignmentStateChanges(page, updateTextContent, assertUpdatedPuhviAssignment, createdAssignmentId)
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
