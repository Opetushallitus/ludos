import { expect, Page } from '@playwright/test'

export async function fillSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: {
  page: Page
  nameTextFi: string
  nameTextSv: string
  contentTextFi: string
  contentTextSv: string
  instructionTextFi: string
  instructionTextSv: string
}) {
  await page.getByTestId('oppimaara').click()
  await page.getByTestId('oppimaara-option-KT7').click()

  await page.getByTestId('assignmentTypeRadio-001').click()

  await page.getByTestId('tavoitetaso').click()
  await page.getByTestId('tavoitetaso-option-0002').click()

  await page.getByTestId('aihe').click()
  await page.getByTestId('aihe-option-001').click()
  await page.getByTestId('aihe-option-002').click()

  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

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

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('instructionFi').fill(instructionTextFi)
  await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('instructionSv').fill(instructionTextSv)
  await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentTextSv)
}

export async function updateSukoAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  instructionTextFi,
  instructionTextSv
}: {
  page: Page
  nameTextFi: string
  nameTextSv: string
  contentTextFi: string
  contentTextSv: string
  instructionTextFi: string
  instructionTextSv: string
}) {
  await page.getByTestId('oppimaara').click()
  await page.getByTestId('oppimaara-option-KT8').click()

  await page.getByTestId('assignmentTypeRadio-002').click()

  await page.getByTestId('tavoitetaso').click()
  await page.getByTestId('tavoitetaso-option-0003').click()

  // remove first selected option
  await page.getByTestId('remove-selected-option').first().click()

  await page.getByTestId('aihe').click()
  // Verify that a option has been removed
  const selectedOptionsAihe = await page.getByTestId('selected-option-aihe').count()
  expect(selectedOptionsAihe).toBe(1)

  // remove all selected options
  await page.getByTestId('reset-selected-options').first().click()

  await page.getByTestId('aihe-label').click()

  // Verify that all options have been removed
  const selectedOptionsAiheResetted = await page.getByTestId('selected-option-aihe').count()

  expect(selectedOptionsAiheResetted).toBe(0)

  await page.getByTestId('aihe').click()
  await page.getByTestId('aihe-option-003').click()
  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('instructionFi').fill(instructionTextFi)
  await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('instructionSv').fill(instructionTextSv)
  await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentTextSv)
}

async function fillLaajalainenOsaaminen(page: Page) {
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos').click()
  // Eettisyys ja ympäristöosaaminen
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-option-05').click()
  await page.getByTestId('laajaalainenOsaaminenKoodiArvos-label').click()
}

export async function fillLdAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv
}: {
  page: Page
  nameTextFi: string
  nameTextSv: string
  contentTextFi: string
  contentTextSv: string
}) {
  await page.getByTestId('aineKoodiArvo').click()
  // Kotitalous
  await page.getByTestId('aineKoodiArvo-option-1').click()

  await page.getByTestId('lukuvuosiKoodiArvos').click()
  // 2020-2021
  await page.getByTestId('lukuvuosiKoodiArvos-option-20202021').click()
  // Close dropdown onBlur
  await page.getByTestId('lukuvuosiKoodiArvos-label').click()

  await fillLaajalainenOsaaminen(page)

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentTextSv)
}

export async function fillPuhviAssignmentForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv
}: {
  page: Page
  nameTextFi: string
  nameTextSv: string
  contentTextFi: string
  contentTextSv: string
}) {
  // Esiintymistaidot
  await page.getByTestId('assignmentTypeRadio-002').click()

  await page.getByTestId('lukuvuosiKoodiArvos').click()
  // 2020-2021
  await page.getByTestId('lukuvuosiKoodiArvos-option-20202021').click()
  // Close dropdown onBlur
  await page.getByTestId('lukuvuosiKoodiArvos-label').click()

  await fillLaajalainenOsaaminen(page)

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentTextSv)
}
