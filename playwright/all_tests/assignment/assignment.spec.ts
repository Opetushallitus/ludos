import { BrowserContext, expect, Page, test } from '@playwright/test'
import { ContentType, Exam, loginTestGroup, Role } from '../../helpers'
import {
  assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage,
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
  contentTextFi: ['Testi sisältö'],
  contentTextSv: ['Testa innehåll'],
  instructionTextFi: 'Testi ohje',
  instructionTextSv: 'Testa instruktion'
}

const createDraftContent = {
  nameTextFi: 'Testi luonnos tehtävä',
  nameTextSv: 'Testuppgifter',
  contentTextFi: ['Testi luonnos sisältö'],
  contentTextSv: ['Testa innehåll'],
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

    await expect(page.getByTestId('notification-success')).toBeVisible()
    await expect(page.getByTestId('assignment-header')).toHaveText(createContent.nameTextFi)
    await expect(page.getByTestId('suko-oppimaara')).toHaveText('Vieraat kielet, A-oppimäärä')
    await expect(page.getByTestId('publish-state')).toHaveText('Julkaistu')

    await page.getByTestId('return').click()

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

    await page.getByTestId('form-update-submit').click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    const updatedAssignmentHeader = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeader).toHaveText(updatedFormData.nameTextFi)

    const expectedOppimaara = 'Vieraat kielet, A-oppimäärä, saksan kieli'
    await expect(page.getByTestId('suko-oppimaara')).toHaveText(expectedOppimaara)
    await expect(page.getByTestId('suko-tehtavatyyppi')).toHaveText('Tekstin tiivistäminen')
    // await expect(page.getByTestId('suko-tavoitetaso')).toBeVisible()
    await expect(page.getByTestId('suko-aihe')).toHaveText('kulttuuri ja luova ilmaisu')
    await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
      'Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, Vuorovaikutusosaaminen'
    )

    await expect(page.getByTestId('languageDropdown')).toBeHidden()

    await page.getByTestId('return').click()
    const assignmentCard = page.getByTestId(`assignment-list-item-${createdAssignmentId}`)
    await expect(assignmentCard).toBeVisible()
    await expect(assignmentCard.getByTestId('suko-oppimaara')).toHaveText(expectedOppimaara)

    await expect(page.getByTestId('languageDropdown')).toBeHidden()
  })

  test('can create draft assignment', async ({ page }) => {
    await fillSukoAssignmentForm({
      page,
      ...createDraftContent
    })

    await page.getByTestId('form-draft').click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    await expect(page.getByTestId('publish-state')).toHaveText('Luonnos')
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

    void page.getByTestId('form-submit').click()
    createdAssignmentId = await getAssignmentIdFromResponse(page)

    await expect(page.getByTestId('notification-success')).toBeVisible()
    await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameTextFi)
    await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
    await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
    await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText('Eettisyys ja ympäristöosaaminen')
    await expect(page.getByTestId('instruction-fi')).toHaveText(formData.instructionTextFi)
    for (const [i, content] of formData.contentTextFi.entries()) {
      await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
    }

    await page.getByTestId('languageDropdown').click()
    await page.getByTestId('languageDropdown-option-sv').click()

    await expect(page.getByTestId('assignment-header')).toHaveText(formData.nameTextSv)
    await expect(page.getByTestId('instruction-sv')).toHaveText(formData.instructionTextSv)
    for (const [i, content] of formData.contentTextSv.entries()) {
      await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
    }

    await page.getByTestId('return').click()

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

    await expect(page.getByTestId('assignment-header')).toBeVisible()
    await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextFi)
    await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
    await expect(page.getByTestId('ld-aine')).toHaveText('Kotitalous')
    await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
      'Eettisyys ja ympäristöosaaminen, Vuorovaikutusosaaminen'
    )

    for (const [i, content] of updatedFormData.contentTextFi.entries()) {
      await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
    }
    await page.getByTestId('languageDropdown').click()
    await page.getByTestId('languageDropdown-option-sv').click()

    await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextSv)
    for (const [i, content] of updatedFormData.contentTextSv.entries()) {
      await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
    }

    await assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
      page,
      createdAssignmentId,
      updatedFormData.nameTextSv
    )
  })

  test('can create draft assignment', async ({ page }) => {
    await fillLdAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: ['Testi sisältö 1', 'Testi sisältö 2'],
      contentTextSv: ['Testa innehåll 1', 'Testa innehåll 2'],
      instructionTextFi: 'Testi ohje',
      instructionTextSv: 'Testa instruktion'
    })

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()
    await expect(page.getByTestId('notification-success')).toBeVisible()
    await expect(page.getByTestId('publish-state')).toHaveText('Luonnos')
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

    await expect(page.getByTestId('notification-success')).toBeVisible()
    await expect(page.getByTestId('assignment-header')).toHaveText(createContent.nameTextFi)

    await page.getByTestId('return').click()

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

    await expect(page.getByTestId('assignment-header')).toBeVisible()
    await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextFi)
    await expect(page.getByTestId('ld-puhvi-lukuvuosi')).toHaveText('2020-2021')
    await expect(page.getByTestId('laajaalainenosaaminen')).toHaveText(
      'Eettisyys ja ympäristöosaaminen, Vuorovaikutusosaaminen'
    )

    for (const [i, content] of updatedFormData.contentTextFi.entries()) {
      await expect(page.getByTestId(`editor-content-fi-${i}`)).toHaveText(content)
    }

    await page.getByTestId('languageDropdown').click()
    await page.getByTestId('languageDropdown-option-sv').click()

    await expect(page.getByTestId('assignment-header')).toHaveText(updatedFormData.nameTextSv)
    for (const [i, content] of updatedFormData.contentTextSv.entries()) {
      await expect(page.getByTestId(`editor-content-sv-${i}`)).toHaveText(content)
    }

    await assertTeachingLanguageDropdownWorksInAssignmentListReturningFromContentPage(
      page,
      createdAssignmentId,
      updatedFormData.nameTextSv
    )
  })

  test('can create draft assignment', async ({ page }) => {
    await fillPuhviAssignmentForm({
      page,
      ...createDraftContent
    })

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')

    await btn.click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    await expect(page.getByTestId('publish-state')).toHaveText('Luonnos')
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')

    await btn.click()
    page.getByTestId('create-koetehtava-button')
  })
})
const testEsitysNakyma = async (page: Page, linkTestId: string, assignmentIn: any) => {
  const newTabPagePromise: Promise<Page> = page.waitForEvent('popup')
  await page.getByTestId(linkTestId).click()
  const newTabPage = await newTabPagePromise

  await expect(newTabPage.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
  await expect(newTabPage.getByTestId('assignment-metadata')).not.toBeVisible()
  await newTabPage.close()
}

test.describe('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const assignmentIn = testAssignmentIn(Exam.Suko, 'Esitysnäkymätesti')
    const assignment = await createAssignment(context, baseURL!, assignmentIn)
    await page.goto(`/suko/${ContentType.koetehtavat}/${assignment.id}`)

    await expect(page.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(page.getByTestId('assignment-metadata')).toBeVisible()

    await testEsitysNakyma(page, 'assignment-action-esitysnakyma', assignmentIn)

    await page.goto(`/suko/${ContentType.koetehtavat}`)
    await testEsitysNakyma(page, `assignment-${assignment.id}-action-esitysnakyma`, assignmentIn)
  })
})

const favoritesCount = async (page: Page): Promise<number> => {
  await expect
    .poll(async () => await page.getByTestId('header-favorites-count').innerText(), {
      message: `wait for current favorite count`
    })
    .toMatch(/^\d+$/)
  return Number(await page.getByTestId('header-favorites-count').innerText())
}

test.describe('Assignment favorites', () => {
  async function prepAssignmentGoToAssignmentList(
    page: Page,
    exam: 'SUKO' | 'PUHVI' | 'LD',
    context: BrowserContext,
    baseURL: string
  ): Promise<[any, number]> {
    await page.goto(`/`)
    const assignmentIn = testAssignmentIn(exam, 'Suosikkitesti')
    const assignment = await createAssignment(context, baseURL, assignmentIn)

    await page.goto(`/${exam.toLowerCase()}/${ContentType.koetehtavat}`)
    await page.getByTestId('assignment-list').locator('li').isVisible()

    const favoriteCountBefore = await favoritesCount(page)

    return [assignment, favoriteCountBefore]
  }

  async function assertFavoritesPage(
    page: Page,
    exam: 'SUKO' | 'PUHVI' | 'LD',
    assignment: any,
    favoriteCountBefore: number
  ) {
    // go to favorites page
    await page.getByTestId('header-favorites').click()
    // go to tab
    await page.getByTestId(`tab-${exam.toLowerCase()}`).click()
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeVisible()
    // go to assignment
    await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('assignment-name-link').click()
    await expect(page.getByTestId('assignment-header')).toHaveText(assignment.nameFi)
    // go back to favorites page
    await page.goBack()
    // test esitysnäkymä
    await testEsitysNakyma(page, `assignment-${assignment.id}-action-esitysnakyma`, assignment)
    // remove favorite
    await page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
    await expect(page.getByTestId('notification-success')).toBeVisible()
    await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeHidden()

    await assertFavoriteCountIsEventually(page, favoriteCountBefore)
  }

  async function assertFavoriteCountIsEventually(page: Page, expectedCount: number) {
    await expect
      .poll(async () => await favoritesCount(page), {
        message: `make sure favorite count eventually updates to ${expectedCount}`
      })
      .toBe(expectedCount)
  }

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from list`, async ({ page, context, baseURL }) => {
      const [assignment, favoriteCountBefore] = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)
      // set assignment as favorite
      void page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
      await page.waitForResponse(
        (response) => response.url().includes(`/api/assignment/${exam}/${assignment.id}/favorite`) && response.ok()
      )
      await assertFavoriteCountIsEventually(page, favoriteCountBefore + 1)

      await assertFavoritesPage(page, exam, assignment, favoriteCountBefore)
    })
  })

  Object.values(Exam).forEach(async (exam) => {
    test(`Can favorite an ${exam} assignment from assignment page`, async ({ page, context, baseURL }) => {
      const [assignment, favoriteCountBefore] = await prepAssignmentGoToAssignmentList(page, exam, context, baseURL!)

      await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('assignment-name-link').click()
      await page.getByTestId(`assignment-${assignment.id}-suosikki`).click()
      await expect(page.getByTestId('notification-success')).toBeVisible()
      await assertFavoriteCountIsEventually(page, favoriteCountBefore + 1)

      await assertFavoritesPage(page, exam, assignment, favoriteCountBefore)
    })
  })
})
