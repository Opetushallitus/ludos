import { Page, expect } from '@playwright/test'

export async function fillAssignmentForm({
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
  await page.getByTestId('aihe-option-1').click()
  await page.getByTestId('aihe-option-2').click()

  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

  await page.getByTestId('laajaalainenOsaaminen').click()
  await page.getByTestId('laajaalainenOsaaminen-option-01').click()

  // Test searching for non-existing option
  await page.getByTestId('laajaalainenOsaaminen-input').fill('non-existing-option')
  // eslint-disable-next-line no-magic-numbers
  await page.waitForTimeout(500) // Wait for search results to update

  // Verify that no options are selected
  const selectedOptions = await page.$$('li[role="option"][aria-selected="true"]')
  expect(selectedOptions).toHaveLength(0)

  await page.getByTestId('laajaalainenOsaaminen-input').fill('globa')
  // eslint-disable-next-line no-magic-numbers
  await page.waitForTimeout(500) // Wait for search results to update
  await page.getByTestId('laajaalainenOsaaminen-option-06').click()

  // Close dropdown onBlur
  await page.getByTestId('laajaalainenOsaaminen-label').click()

  await page.getByTestId('laajaalainenOsaaminen').click()
  await page.getByTestId('laajaalainenOsaaminen-option-02').click()

  // Close dropdown onBlur
  await page.getByTestId('laajaalainenOsaaminen-label').click()

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('instructionFi').fill(instructionTextFi)
  await page.getByTestId('contentFi').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('instructionSv').fill(instructionTextSv)
  await page.getByTestId('contentSv').fill(contentTextSv)
}

export async function updateAssignmentForm({
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
  await page.getByTestId('aihe-option-3').click()

  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

  // Close dropdown onBlur
  await page.getByTestId('aihe-label').click()

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('instructionFi').fill(instructionTextFi)
  await page.getByTestId('contentFi').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('instructionSv').fill(instructionTextSv)
  await page.getByTestId('contentSv').fill(contentTextSv)
}

export async function fillInstructionForm({
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
  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('contentFi').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
  await page.getByTestId('contentSv').fill(contentTextSv)
}
