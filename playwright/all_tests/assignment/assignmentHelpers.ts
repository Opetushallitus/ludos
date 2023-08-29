import { expect, Page } from '@playwright/test'

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
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-label').click()
}

async function fillLukuvuosi(page: Page) {
  await page.getByTestId('lukuvuosiKoodiArvos').click()
  // 2020-2021
  await page.getByTestId('lukuvuosiKoodiArvos-option-20202021').click()
  // Close dropdown onBlur
  await page.getByTestId('lukuvuosiKoodiArvos-label').click()
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
    const optionIsHidden = await page.getByTestId(`laajaalainenOsaaminen-option-${option}`).isHidden()
    expect(optionIsHidden).toBeTruthy()
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
  await page.getByTestId('remove-selected-option').first().click()
  await page.getByTestId('aihe').click()
  // Verify that option has been removed
  const selectedOptionsAihe = await page.getByTestId('selected-option-aihe').count()
  expect(selectedOptionsAihe).toBe(1)
  // remove all selected options
  await page.getByTestId('reset-selected-options').first().click()

  await page.getByTestId('aihe-label').click()
  // Verify that all options have been removed
  const selectedOptionsAiheResetted = await page.getByTestId('selected-option-aihe').count()

  expect(selectedOptionsAiheResetted).toBe(0)

  await selectDropdownOption(page, 'aihe', '003')
  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

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

export async function updateLdAndPuhviAssignment(page: Page) {
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

  await page.getByTestId('assignment-header').isVisible()
  const updatedAssignmentHeader = page.getByTestId('assignment-header')
  await expect(updatedAssignmentHeader).toHaveText('Testi tehtävä muokattu')
  await page.getByText('Testi sisältö muokattu', { exact: true }).isVisible()

  await page.getByText('Tehtävätyyppi: Tekstin tiivistäminen').isVisible()
  await page.getByText('Tavoitetaso:A1.2 Kehittyvä alkeiskielitaito').isVisible()
  await page.getByText('Laaja-alainen osaaminen:Globaali- ja kulttuuriosaaminen, Hyvinvointiosaaminen, V').isVisible()

  await page.getByTestId('language-dropdown').click()
  await page.getByTestId('language-dropdown-option-sv').click()

  const updatedAssignmentHeaderSv = page.getByTestId('assignment-header')

  await expect(updatedAssignmentHeaderSv).toHaveText('Testuppgifter muokattu')
}
