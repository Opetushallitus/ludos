import { Page, expect } from '@playwright/test'

export async function fillAssignmentForm({
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
  await page.waitForTimeout(500) // Wait for search results to update

  // Verify that no options are selected
  const selectedOptions = await page.$$('li[role="option"][aria-selected="true"]')
  expect(selectedOptions).toHaveLength(0)

  await page.getByTestId('laajaalainenOsaaminen-input').fill('globa')
  await page.waitForTimeout(500) // Wait for search results to update
  await page.getByTestId('laajaalainenOsaaminen-option-06').click()

  // Close dropdown onBlur
  await page.getByTestId('laajaalainenOsaaminen-label').click()

  await page.getByTestId('laajaalainenOsaaminen').click()
  await page.getByTestId('laajaalainenOsaaminen-option-02').click()

  // Close dropdown onBlur
  await page.getByTestId('laajaalainenOsaaminen-label').click()

  await page.getByTestId('nameFi').fill(nameTextFi)
  await page.getByTestId('contentFi').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByTestId('nameSv').fill(nameTextSv)
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
