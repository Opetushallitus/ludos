import { expect, Page, test } from '@playwright/test'
import {
  assertSuccessNotification,
  Exam,
  examsLowerCase,
  FormAction,
  loginTestGroup,
  Role,
  setTeachingLanguage
} from '../../helpers'
import {
  assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage,
  fillLdAssignmentForm,
  fillPuhviAssignmentForm,
  fillSukoAssignmentForm,
  updateLdAssignment,
  updatePuhviAssignment,
  updateSukoAssignmentForm
} from './assignmentHelpers'
import { TeachingLanguage } from 'web/src/types'

const createContent = {
  nameTextFi: 'Testi tehtävä',
  nameTextSv: 'Testuppgifter',
  contentTextFi: ['Testi sisältö'],
  contentTextSv: ['Testa innehåll'],
  instructionTextFi: 'Testi ohje',
  instructionTextSv: 'Testa instruktion'
}

async function getAssignmentIdFromResponse(page: Page) {
  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/assignment/') && response.ok()
  )

  return (await response.json()).id
}

loginTestGroup(test, Role.YLLAPITAJA)

async function createAndAssertSukoAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillSukoAssignmentForm({
    page,
    ...createContent
  })

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(createContent.nameTextFi)
  await expect(page.getByTestId('suko-oppimaara')).toHaveText('Vieraat kielet, A-oppimäärä')
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function assertUpdatedSukoAssignment(
  page: Page,
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  createdAssignmentId: number,
  action: FormAction
) {
  const updatedAssignmentHeader = page.getByTestId('assignment-header')

  await expect(updatedAssignmentHeader).toHaveText(updatedFormData.nameTextFi)
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
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  createdAssignmentId: number,
  action: FormAction
) {
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await setTeachingLanguage(page, TeachingLanguage.fi)
  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextFi)
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
  await assertCommonBetweenLdAndPuhvi(page, updatedFormData, createdAssignmentId)
}

async function assertUpdatedPuhviAssignment(
  page: Page,
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  createdAssignmentId: number,
  action: FormAction
) {
  await setTeachingLanguage(page, TeachingLanguage.fi)
  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextFi)
  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await assertCommonBetweenLdAndPuhvi(page, updatedFormData, createdAssignmentId)
}

async function navigateToEditAssignment(page: Page, createdAssignmentId: number, action: FormAction) {
  await page.getByTestId(`assignment-${createdAssignmentId}-edit`).click()
  await page.getByTestId(`form-update-${action}`).click()
}

async function assertPublishedAssignmentStateChanges(
  page: Page,
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  assertAssignmentFn: (page: Page, data: any, assignmentId: number, action: FormAction) => Promise<void>,
  createdAssignmentId: number
) {
  await page.getByTestId('form-update-submit').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'submit')

  await navigateToEditAssignment(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'draft')

  await navigateToEditAssignment(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'draft')

  await navigateToEditAssignment(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'submit')
}

async function assertDraftAssignmentStateChanges(
  page: Page,
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  assertAssignmentFn: (page: Page, data: any, assignmentId: number, action: FormAction) => Promise<void>,
  createdAssignmentId: number
) {
  await page.getByTestId('form-update-draft').click()
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'draft')

  await navigateToEditAssignment(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.julkaisu-onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'submit')

  await navigateToEditAssignment(page, createdAssignmentId, 'submit')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.onnistui')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'submit')

  await navigateToEditAssignment(page, createdAssignmentId, 'draft')
  await assertSuccessNotification(page, 'form.notification.tehtavan-tallennus.palautettu-luonnostilaan')
  await assertAssignmentFn(page, updatedFormData, createdAssignmentId, 'draft')
}

async function createAndUpdateSukoPublishedAssignment(page: Page, action: FormAction) {
  const createdAssignmentId = await createAndAssertSukoAssignment(
    page,
    action,
    'form.notification.tehtavan-tallennus.julkaisu-onnistui'
  )

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const updatedFormData = {
    nameTextFi: 'Testi tehtävä muokattu',
    nameTextSv: 'Testuppgifter muokattu',
    contentTextFi: ['Testi sisältö muokattu'],
    contentTextSv: ['Testa innehåll muokattu'],
    instructionTextFi: 'Testi ohjeet muokattu',
    instructionTextSv: 'Testa instruktioner muokattu'
  }

  await updateSukoAssignmentForm({
    page,
    ...updatedFormData
  })
  await assertPublishedAssignmentStateChanges(page, updatedFormData, assertUpdatedSukoAssignment, createdAssignmentId)

  await deleteAssignment(page, 'suko', createdAssignmentId)
}

async function createAndUpdateSukoDraftAssignment(page: Page, action: FormAction) {
  const createdAssignmentId = await createAndAssertSukoAssignment(
    page,
    action,
    'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const updatedFormData = {
    nameTextFi: 'Testi tehtävä muokattu',
    nameTextSv: 'Testuppgifter muokattu',
    contentTextFi: ['Testi sisältö muokattu'],
    contentTextSv: ['Testa innehåll muokattu'],
    instructionTextFi: 'Testi ohjeet muokattu',
    instructionTextSv: 'Testa instruktioner muokattu'
  }

  await updateSukoAssignmentForm({
    page,
    ...updatedFormData
  })

  await assertDraftAssignmentStateChanges(page, updatedFormData, assertUpdatedSukoAssignment, createdAssignmentId)

  await deleteAssignment(page, 'suko', createdAssignmentId)
}

async function assertCommonBetweenLdAndPuhvi(
  page: Page,
  updatedFormData: {
    instructionTextFi: string
    instructionTextSv: string
    contentTextFi: string[]
    contentTextSv: string[]
    nameTextFi: string
    nameTextSv: string
  },
  createdAssignmentId: number
) {
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
    'Eettisyys ja ympäristöosaaminen, Vuorovaikutusosaaminen'
  )

  for (const [i, content] of updatedFormData.contentTextFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextSv)
  for (const [i, content] of updatedFormData.contentTextSv.entries()) {
    await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
  }

  await assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
    page,
    createdAssignmentId,
    updatedFormData.nameTextSv
  )
}

async function createAndAssertLdAssignment(page: Page, action: FormAction) {
  let createdAssignmentId: number

  const formData = {
    nameTextFi: 'Testi tehtävä',
    nameTextSv: 'Testuppgifter',
    contentTextFi: ['Testi sisältö 1', 'Testi sisältö 2'],
    contentTextSv: ['Testa innehåll 1', 'Testa innehåll 2'],
    instructionTextFi: 'Testi ohje',
    instructionTextSv: 'Testa instruktion'
  }
  await fillLdAssignmentForm({
    page,
    ...formData
  })

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  createdAssignmentId = await getAssignmentIdFromResponse(page)

  await expect(page.getByTestId('publish-state')).toHaveText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos')
  await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameTextFi)
  await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
  await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
  await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Eettisyys ja ympäristöosaaminen')
  await expect(page.getByTestId('instruction-fi')).toHaveText(formData.instructionTextFi)
  for (const [i, content] of formData.contentTextFi.entries()) {
    await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
  }

  await setTeachingLanguage(page, TeachingLanguage.sv)

  await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameTextSv)
  await expect(page.getByTestId('instruction-sv')).toHaveText(formData.instructionTextSv)
  for (const [i, content] of formData.contentTextSv.entries()) {
    await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
  }

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function createLdAssignment(page: Page, action: 'submit' | 'draft' | 'cancel' | 'delete') {
  const createdAssignmentId = await createAndAssertLdAssignment(page, action)

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const updatedFormData = {
    nameTextFi: 'Testi tehtävä muokattu',
    nameTextSv: 'Testuppgifter muokattu',
    instructionTextFi: 'Testi ohjeet muokattu',
    instructionTextSv: 'Testa instruktioner muokattu',
    contentTextFi: ['Testi sisältö muokattu 1', 'Testi sisältö muokattu 2'],
    contentTextSv: ['Testa innehåll muokattu 1', 'Testa innehåll muokattu 2']
  }

  await updateLdAssignment({
    page,
    ...updatedFormData
  })
  return { createdAssignmentId, updatedFormData }
}

async function createAndUpdateLdPublishedAssignment(page: Page, action: FormAction) {
  const { createdAssignmentId, updatedFormData } = await createLdAssignment(page, action)
  await assertPublishedAssignmentStateChanges(page, updatedFormData, assertUpdatedLdAssignment, createdAssignmentId)
  await deleteAssignment(page, 'ld', createdAssignmentId)
}

async function createAndUpdateLdDraftAssignment(page: Page, action: FormAction) {
  const { createdAssignmentId, updatedFormData } = await createLdAssignment(page, action)
  await assertDraftAssignmentStateChanges(page, updatedFormData, assertUpdatedLdAssignment, createdAssignmentId)
  await deleteAssignment(page, 'ld', createdAssignmentId)
}

async function createAndAssertPuhviAssignment(page: Page, action: FormAction, expectedNotification: string) {
  await fillPuhviAssignmentForm({
    page,
    ...createContent
  })

  void page.getByTestId(action === 'submit' ? 'form-submit' : 'form-draft').click()

  const createdAssignmentId = await getAssignmentIdFromResponse(page)

  await assertSuccessNotification(page, expectedNotification)
  await expect(page.getByTestId('assignment-header')).toHaveText(createContent.nameTextFi)

  await page.getByTestId('return').click()
  return createdAssignmentId
}

async function createAndUpdatePuhviPublishedAssignment(page: Page, action: FormAction) {
  const createdAssignmentId = await createAndAssertPuhviAssignment(
    page,
    action,
    'form.notification.tehtavan-tallennus.julkaisu-onnistui'
  )

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const updatedFormData = {
    nameTextFi: 'Testi tehtävä muokattu',
    nameTextSv: 'Testuppgifter muokattu',
    instructionTextFi: 'Testi ohjeet muokattu',
    instructionTextSv: 'Testa instruktioner muokattu',
    contentTextFi: ['Testi sisältö muokattu'],
    contentTextSv: ['Testa innehåll muokattu']
  }

  await updatePuhviAssignment({
    page,
    ...updatedFormData
  })

  await assertPublishedAssignmentStateChanges(page, updatedFormData, assertUpdatedPuhviAssignment, createdAssignmentId)
  await deleteAssignment(page, 'puhvi', createdAssignmentId)
}

async function createAndUpdatePuhviDraftAssignment(page: Page, action: FormAction) {
  const createdAssignmentId = await createAndAssertPuhviAssignment(
    page,
    action,
    'form.notification.tehtavan-tallennus.luonnos-onnistui'
  )

  await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
  await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

  const updatedFormData = {
    nameTextFi: 'Testi tehtävä muokattu',
    nameTextSv: 'Testuppgifter muokattu',
    instructionTextFi: 'Testi ohjeet muokattu',
    instructionTextSv: 'Testa instruktioner muokattu',
    contentTextFi: ['Testi sisältö muokattu'],
    contentTextSv: ['Testa innehåll muokattu']
  }

  await updatePuhviAssignment({
    page,
    ...updatedFormData
  })

  await assertDraftAssignmentStateChanges(page, updatedFormData, assertUpdatedPuhviAssignment, createdAssignmentId)
  await deleteAssignment(page, 'puhvi', createdAssignmentId)
}

async function cancelAssignmentCreation(page: Page) {
  const btn = page.getByTestId('form-cancel')
  await expect(btn).toHaveText('button.peruuta')

  await btn.click()
  page.getByTestId('create-koetehtava-button')
}

async function cancelAssignmentUpdateCreation(page: Page, exam: string) {
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
    publishTest: (page: Page) => createAndUpdateSukoPublishedAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateSukoDraftAssignment(page, 'draft')
  },
  ld: {
    publishTest: (page: Page) => createAndUpdateLdPublishedAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdateLdDraftAssignment(page, 'draft')
  },
  puhvi: {
    publishTest: (page: Page) => createAndUpdatePuhviPublishedAssignment(page, 'submit'),
    draftTest: (page: Page) => createAndUpdatePuhviDraftAssignment(page, 'draft')
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

    test(`can cancel ${exam} assignment update creating`, async ({ page }) =>
      await cancelAssignmentUpdateCreation(page, exam))
  })
})
