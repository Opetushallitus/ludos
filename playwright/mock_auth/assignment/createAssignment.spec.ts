import { expect, test } from '@playwright/test'
import { fillLdAssignmentForm, fillSukoAssignmentForm, fillPuhviAssignmentForm } from './assignmentHelpers'

test.describe('Suko assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('create-koetehtava-button').click()
  })

  test('can create a new suko assignment', async ({ page }) => {
    await fillSukoAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll',
      instructionTextFi: 'Testi ohje',
      instructionTextSv: 'Testa instruktion'
    })

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')
  })

  test('can create draft assignment', async ({ page }) => {
    await page.getByTestId('nameFi').fill('Testi luonnos tehtävä')
    await page.getByTestId('oppimaara').click()
    await page.getByTestId('oppimaara-option-KT7').click()
    await page.getByTestId('assignmentTypeRadio-002').click()
    await page.getByTestId('contentFi').fill('Testi luonnos sisältö')
    await page.getByTestId('tab-sv').click()

    await page.getByTestId('nameSv').fill('Testi luonnos tehtävä')
    await page.getByTestId('tavoitetaso').click()
    await page.getByTestId('tavoitetaso-option-0002').click()

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
    await fillLdAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll'
    })

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')
  })

  test('can create draft assignment', async ({ page }) => {
    await fillLdAssignmentForm({
      page,
      nameTextFi: 'Testi luonnos tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi luonnos sisältö',
      contentTextSv: 'Testa innehåll'
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
    await fillPuhviAssignmentForm({
      page,
      nameTextFi: 'Testi tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll'
    })

    await page.getByTestId('form-submit').click()

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')
  })

  test('can create draft assignment', async ({ page }) => {
    await fillPuhviAssignmentForm({
      page,
      nameTextFi: 'Testi luonnos tehtävä',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi luonnos sisältö',
      contentTextSv: 'Testa innehåll'
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
