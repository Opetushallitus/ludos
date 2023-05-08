import { Page } from '@playwright/test'

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
  await page.getByTestId('assignmentTypeRadio-lukeminen').click()

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
