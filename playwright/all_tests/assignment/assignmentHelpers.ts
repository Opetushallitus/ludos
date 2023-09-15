import { BrowserContext, expect, Page } from '@playwright/test'
import { Exam, postWithSession } from '../../helpers'

type FillAssignmentForm = {
  page: Page
  nameTextFi: string
  nameTextSv: string
  contentTextFi: string
  contentTextSv: string
  instructionTextFi: string
  instructionTextSv: string
}

type FiAndSvTextFields = {
  fi: string
  sv: string
}

async function selectDropdownOption(page: Page, testId: string, optionId: string) {
  await page.getByTestId(testId).click()
  await page.getByTestId(`${testId}-option-${optionId}`).click()
}

async function fillMultiselectDropdownOption(page: Page, testId: string, optionsIds: string[]) {
  await page.getByTestId(testId).click()

  for (const optionId of optionsIds) {
    await page.getByTestId(`${testId}-option-${optionId}`).click()
  }

  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-option-05').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-multi-select-ready-button').click()
}

async function fillLukuvuosi(page: Page) {
  await page.getByTestId('lukuvuosiKoodiArvos').click()
  // 2020-2021
  await page.getByTestId('lukuvuosiKoodiArvos-option-20202021').click()
  // Close dropdown onBlur
  await page.getByTestId('lukuvuosiKoodiArvos-multi-select-ready-button').click()
}

async function fillTextFields(
  page: Page,
  contentText: string,
  nameText: string,
  instructionText: string,
  lang: 'Fi' | 'Sv'
) {
  await page.getByTestId(`name${lang}`).fill(nameText)
  await page.getByTestId(`instruction${lang}`).fill(instructionText)
  await page
    .getByTestId(`editor-content-${lang.toLowerCase()}`)
    .locator('div[contenteditable="true"]')
    .fill(contentText)
}

export async function fillFinAndSvTextFields(
  page: Page,
  contentText: FiAndSvTextFields,
  nameText: FiAndSvTextFields,
  instructionText: FiAndSvTextFields
) {
  await fillTextFields(page, contentText.fi, nameText.fi, instructionText.fi, 'Fi')
  await page.getByTestId('tab-sv').click()
  await fillTextFields(page, contentText.sv, nameText.sv, instructionText.sv, 'Sv')
}

export async function fillSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: FillAssignmentForm) {
  await selectDropdownOption(page, 'oppimaara', 'KT7')
  await page.getByTestId('assignmentTypeRadio-001').click()
  await selectDropdownOption(page, 'tavoitetaso', '0002')

  await page.getByTestId('aihe').click()
  await page.getByTestId('aihe-option-001').click()
  await page.getByTestId('aihe-option-002').click()
  await page.getByTestId('aihe-multi-select-ready-button').click()

  await page.getByTestId('laajaalainenOsaaminen-expand-dropdown-icon').click()
  await page.getByTestId('laajaalainenOsaaminen-option-01').click()
  await page.getByTestId('laajaalainenOsaaminen-multi-select-ready-button').click()

  // Test searching for non-existing option
  await page.getByTestId('laajaalainenOsaaminen-input').fill('non-existing-option')

  const allAvailableLaajaalainenOptions = ['01', '02', '03', '04', '05', '06']

  for (const option of allAvailableLaajaalainenOptions) {
    await expect(page.getByTestId(`laajaalainenOsaaminen-option-${option}`)).toBeHidden()
  }

  // Test searching for existing option Globaali- ja kulttuurinen osaaminen, KoodiArvo: 06
  await page.getByTestId('laajaalainenOsaaminen-input').fill('globa')
  await page.getByTestId('laajaalainenOsaaminen-option-06').click()
  await page.getByTestId('laajaalainenOsaaminen-multi-select-ready-button').click()

  await page.getByTestId('laajaalainenOsaaminen-input').click()
  await page.getByTestId('laajaalainenOsaaminen-option-02').click()
  await page.getByTestId('laajaalainenOsaaminen-multi-select-ready-button').click()

  await fillFinAndSvTextFields(
    page,
    { fi: contentTextFi, sv: contentTextSv },
    { fi: nameTextFi, sv: nameTextSv },
    { fi: instructionTextFi, sv: instructionTextSv }
  )
}

export async function updateSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: FillAssignmentForm) {
  await selectDropdownOption(page, 'oppimaara', 'KT8')
  await page.getByTestId('assignmentTypeRadio-002').click()
  await selectDropdownOption(page, 'tavoitetaso', '0003')
  // remove first selected option
  await page.getByTestId('aihe-remove-selected-option').first().click()
  await page.getByTestId('aihe').click()
  // Verify that option has been removed
  const selectedOptionsAihe = await page.getByTestId('selected-option-aihe').count()
  expect(selectedOptionsAihe).toBe(1)
  // remove all selected options
  await page.getByTestId('aihe-reset-selected-options').first().click()
  await page.getByTestId('aihe-multi-select-ready-button').click()
  // Verify that all options have been removed
  const selectedOptionsAiheResetted = await page.getByTestId('selected-option-aihe').count()

  expect(selectedOptionsAiheResetted).toBe(0)

  await selectDropdownOption(page, 'aihe', '003')
  await page.getByTestId('aihe-multi-select-ready-button').click()

  await fillFinAndSvTextFields(
    page,
    { fi: contentTextFi, sv: contentTextSv },
    { fi: nameTextFi, sv: nameTextSv },
    { fi: instructionTextFi, sv: instructionTextSv }
  )
}

export async function fillLdAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: FillAssignmentForm) {
  // Kotitalous
  await selectDropdownOption(page, 'aineKoodiArvo', '1')

  await fillLukuvuosi(page)

  // Eettisyys ja ympäristöosaaminen
  await fillMultiselectDropdownOption(page, 'laajaalainenOsaaminenKoodiArvos', ['05'])

  await fillFinAndSvTextFields(
    page,
    { fi: contentTextFi, sv: contentTextSv },
    { fi: nameTextFi, sv: nameTextSv },
    { fi: instructionTextFi, sv: instructionTextSv }
  )
}

export async function fillPuhviAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: FillAssignmentForm) {
  // Esiintymistaidot
  await page.getByTestId('assignmentTypeRadio-002').click()
  await fillLukuvuosi(page)
  await fillMultiselectDropdownOption(page, 'laajaalainenOsaaminenKoodiArvos', ['05'])

  await fillFinAndSvTextFields(
    page,
    { fi: contentTextFi, sv: contentTextSv },
    { fi: nameTextFi, sv: nameTextSv },
    { fi: instructionTextFi, sv: instructionTextSv }
  )
}

export async function updateLdAssignment(page: Page) {
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-input').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-option-02').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-multi-select-ready-button').click()

  await fillFinAndSvTextFields(
    page,
    { fi: 'Testi sisältö muokattu', sv: 'Testa innehåll muokattu' },
    { fi: 'Testi tehtävä muokattu', sv: 'Testuppgifter muokattu' },
    { fi: 'Testi ohjeet muokattu', sv: 'Testa instruktioner muokattu' }
  )

  await page.getByTestId('form-submit').click()

  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText('Testi tehtävä muokattu')
  await expect(page.getByText('Lukuvuosi:2020-2021')).toBeVisible()
  await expect(page.getByText('Aine:Kotitalous')).toBeVisible()
  await expect(page.getByText('Laaja-alainen osaaminen:Vuorovaikutusosaaminen')).toBeVisible()

  await expect(page.getByText('Testi sisältö muokattu', { exact: true })).toBeVisible()
  await page.getByTestId('language-dropdown').click()
  await page.getByTestId('language-dropdown-option-sv').click()

  await expect(page.getByTestId('assignment-header')).toHaveText('Testuppgifter muokattu')
}

export async function updatePuhviAssignment(page: Page) {
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-input').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-option-02').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-multi-select-ready-button').click()

  await fillFinAndSvTextFields(
    page,
    { fi: 'Testi sisältö muokattu', sv: 'Testa innehåll muokattu' },
    { fi: 'Testi tehtävä muokattu', sv: 'Testuppgifter muokattu' },
    { fi: 'Testi ohjeet muokattu', sv: 'Testa instruktioner muokattu' }
  )

  await page.getByTestId('form-submit').click()

  await expect(page.getByTestId('assignment-header')).toBeVisible()
  await expect(page.getByTestId('assignment-header')).toHaveText('Testi tehtävä muokattu')
  await expect(page.getByText('Lukuvuosi:2020-2021')).toBeVisible()
  await expect(page.getByText('Laaja-alainen osaaminen:Vuorovaikutusosaaminen')).toBeVisible()

  await expect(page.getByText('Testi sisältö muokattu', { exact: true })).toBeVisible()
  await page.getByTestId('language-dropdown').click()
  await page.getByTestId('language-dropdown-option-sv').click()

  await expect(page.getByTestId('assignment-header')).toHaveText('Testuppgifter muokattu')
}

export function testAssignmentIn(exam: Exam, assignmnentNameBase: string) {
  const base = {
    exam: exam,
    nameFi: `${assignmnentNameBase} nimi fi`,
    nameSv: `${assignmnentNameBase} nimi sv`,
    contentFi: `${assignmnentNameBase} sisältö fi`,
    contentSv: `${assignmnentNameBase} sisältö sv`,
    instructionFi: `${assignmnentNameBase} ohje fi`,
    instructionSv: `${assignmnentNameBase} ohje sv`,
    publishState: 'PUBLISHED',
    laajaalainenOsaaminenKoodiArvos: []
  }

  if (exam === Exam.Suko) {
    return {
      ...base,
      assignmentTypeKoodiArvo: '003',
      oppimaaraKoodiArvo: 'TKRUA1',
      tavoitetasoKoodiArvo: null,
      aiheKoodiArvos: []
    }
  } else if (exam === Exam.Ld) {
    return {
      ...base,
      lukuvuosiKoodiArvos: ['20202021'],
      aineKoodiArvo: '1'
    }
  } else if (exam === Exam.Puhvi) {
    return {
      ...base,
      assignmentTypeKoodiArvo: '002',
      lukuvuosiKoodiArvos: ['20202021']
    }
  } else {
    throw new Error('Unknown exam')
  }
}

export async function createAssignment(context: BrowserContext, baseURL: string, assignment: any) {
  return (await postWithSession(context, `${baseURL}/api/assignment`, JSON.stringify(assignment))).json()
}

export async function checkListAfterFiltering(page: Page, expectedAssignmentTitleNumbers: number[], exam: Exam) {
  const assignments = await page.getByTestId('assignment-list').locator('li').all()
  const namePromises = assignments.map((listItem) => listItem.getByTestId('assignment-name-link').innerText())
  const names = await Promise.all(namePromises)
  expect(names).toEqual(expectedAssignmentTitleNumbers.map((number) => `Test name ${number} FI ${exam}`))
}
