import { BrowserContext, expect, Page, test } from '@playwright/test'
import { Exam, loginTestGroup, Role } from '../../helpers'
import {
  createAssignment,
  fillLdAssignmentForm,
  fillPuhviAssignmentForm,
  fillSukoAssignmentForm,
  testAssignmentIn,
  updateLdAssignment,
  updatePuhviAssignment,
  updateSukoAssignmentForm
} from './assignmentHelpers'

const createContent = {
  nameTextFi: 'Testi tehtävä',
  nameTextSv: 'Testuppgifter',
  contentTextFi: 'Testi sisältö',
  contentTextSv: 'Testa innehåll',
  instructionTextFi: 'Testi ohje',
  instructionTextSv: 'Testa instruktion'
}

const createDraftContent = {
  nameTextFi: 'Testi luonnos tehtävä',
  nameTextSv: 'Testuppgifter',
  contentTextFi: 'Testi luonnos sisältö',
  contentTextSv: 'Testa innehåll',
  instructionTextFi: 'Testi luonnos ohje',
  instructionTextSv: 'Testa instruktion'
}

async function getAssignmentIdFromResponse(page: Page) {
  const response = await page.waitForResponse(
    (response) => response.url().includes('/api/assignment/') && response.ok()
  )

  return (await response.json()).id
}

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Suko assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('create-koetehtava-button').click()
  })

  test('can create and update a suko assignment', async ({ page }) => {
    let createdAssignmentId: number

    await fillSukoAssignmentForm({
      page,
      ...createContent
    })

    void page.getByTestId('form-submit').click()
    createdAssignmentId = await getAssignmentIdFromResponse(page)

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')

    await page.getByTestId('return').click()

    await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    await updateSukoAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä muokattu',
      nameTextSv: 'Testuppgifter muokattu',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testa innehåll muokattu',
      instructionTextFi: 'Testi ohjeet muokattu',
      instructionTextSv: 'Testa instruktioner muokattu'
    })

    await page.getByTestId('form-submit').click()

    const updatedAssignmentHeader = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeader).toHaveText('Testi tehtävä muokattu')

    await expect(page.getByTestId('suko-tehtavatyyppi')).toHaveText('Tekstin tiivistäminen')
    // await expect(page.getByTestId('suko-tavoitetaso')).toBeVisible()
    await expect(page.getByTestId('suko-aihe')).toHaveText('kulttuuri ja luova ilmaisu')
    await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
      'Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, Vuorovaikutusosaaminen'
    )

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    await expect(page.getByTestId('assignment-header')).toHaveText('Testuppgifter muokattu')
  })

  test('can create draft assignment', async ({ page }) => {
    await fillSukoAssignmentForm({
      page,
      ...createDraftContent
    })

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-koetehtava-button')
  })
})

test.describe('Ld assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-ld').click()
    await page.getByTestId('create-koetehtava-button').click()
  })

  test('can create and update a LD assignment', async ({ page }) => {
    let createdAssignmentId: number

    await fillLdAssignmentForm({
      page,
      ...createContent
    })

    void page.getByTestId('form-submit').click()
    createdAssignmentId = await getAssignmentIdFromResponse(page)

    await expect(page.getByTestId('assignment-header')).toHaveText('Testi tehtävä')

    await page.getByTestId('return').click()

    await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    await updateLdAssignment(page)
  })

  test('can create draft assignment', async ({ page }) => {
    await fillLdAssignmentForm({
      page,
      ...createDraftContent
    })

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-koetehtava-button')
  })
})

test.describe('Puhvi assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-puhvi').click()
    await page.getByTestId('create-koetehtava-button').click()
  })

  test('can create and update a Puhvi assignment', async ({ page }) => {
    let createdAssignmentId: number

    await fillPuhviAssignmentForm({
      page,
      ...createContent
    })

    void page.getByTestId('form-submit').click()
    createdAssignmentId = await getAssignmentIdFromResponse(page)

    await expect(page.getByTestId('assignment-header')).toHaveText('Testi tehtävä')

    await page.getByTestId('return').click()

    await page.getByTestId(`assignment-list-item-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    await updatePuhviAssignment(page)
  })

  test('can create draft assignment', async ({ page }) => {
    await fillPuhviAssignmentForm({
      page,
      ...createDraftContent
    })

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()

    page.getByText('Luonnos', { exact: true })
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-koetehtava-button')
  })
})

test.describe('Presentation view', () => {
  const testKatseluNakyma = async (page: Page, linkTestId: string, assignmentIn: any) => {
    const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
    await page.getByTestId(linkTestId).click()
    const newTabPage = await newTabPagePromise

    await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(await newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
    await newTabPage.close()
  }

  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const assignmentIn = testAssignmentIn(Exam.Suko, 'Esitysnäkymätesti')
    const assignment = await createAssignment(context, baseURL!, assignmentIn)
    await page.goto(`/suko/assignments/${assignment.id}`)

    await expect(page.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(await page.getByTestId('assignment-metadata')).toBeVisible()

    await testKatseluNakyma(page, 'assignment-action-katselunakyma', assignmentIn)

    await page.goto(`/suko/assignments`)
    await testKatseluNakyma(page, `assignment-${assignment.id}-action-katselunakyma`, assignmentIn)
  })
})

const favoritesCount = async (page: Page): Promise<string> =>
  await page.getByTestId('header-favorites-count').innerText()

test.describe('Assignment favorites', () => {
  async function prepAssignmentGoToAssignmentList(
    page: Page,
    exam: 'SUKO' | 'PUHVI' | 'LD',
    context: BrowserContext,
    baseURL: string
  ) {
    await page.goto('/')
    const assignmentIn = testAssignmentIn(exam, 'Suosikkitesti')
    const assignment = await createAssignment(context, baseURL, assignmentIn)

    await page.goto(`/${exam.toLowerCase()}/assignments`)
    await page.getByTestId('assignment-list').locator('li').isVisible()
    return assignment
  }

  async function assertFavoritesPage(page: Page, exam: 'SUKO' | 'PUHVI' | 'LD', assignment: any) {
    // go to favorites page
    await page.getByTestId('header-favorites').click()
    // go to tab
    await page.getByTestId(`tab-${exam.toLowerCase()}`).click()
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeVisible()

    await page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeHidden()

    await expect
      .poll(async () => await favoritesCount(page), {
        message: 'make sure favorite count eventually updates'
      })
      .toBe('0')
  }

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from list`, async ({ page, context, baseURL }) => {
      const assignment = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)
      // set assignment as favorite
      void page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
      await page.waitForResponse(
        (response) => response.url().includes(`/api/assignment/${exam}/${assignment.id}/favorite`) && response.ok()
      )

      // check total favorites count
      await expect
        .poll(async () => await favoritesCount(page), {
          message: 'make sure favorite count eventually updates'
        })
        .toBe('1')

      await assertFavoritesPage(page, exam, assignment)
    })
  })

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from assignment page`, async ({ page, context, baseURL }) => {
      const assignment = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)

      await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('assignment-name-link').click()
      await page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
      // check total favorites count
      await expect(page.getByTestId('header-favorites-count')).toHaveText('1')

      await assertFavoritesPage(page, exam, assignment)
    })
  })
})
