import { expect, Page, test } from '@playwright/test'
import {
  fillLdAssignmentForm,
  fillPuhviAssignmentForm,
  fillSukoAssignmentForm,
  updateLdAndPuhviAssignment,
  updateSukoAssignmentForm
} from './assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'

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

  test('can create a new suko assignment', async ({ page }) => {
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

    await page.getByText('Tehtävätyyppi: Tekstin tiivistäminen').isVisible()
    await page.getByText('Tavoitetaso:A1.2 Kehittyvä alkeiskielitaito').isVisible()
    await page.getByText('Laaja-alainen osaaminen:Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, V').isVisible()

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    const updatedAssignmentHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeaderSv).toHaveText('Testuppgifter muokattu')
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

  test('can create a new LD assignment', async ({ page }) => {
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

    await updateLdAndPuhviAssignment(page)
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

  test('can create a new Puhvi assignment', async ({ page }) => {
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

    await updateLdAndPuhviAssignment(page)
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
