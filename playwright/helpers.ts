import { Page } from '@playwright/test'

export async function fillSukoForm({
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
  await page.getByLabel('Tekstin lukeminen').click()

  await page.getByLabel('form.tehtavannimi').fill(nameTextFi)
  await page.getByLabel('form.tehtavansisalto').fill(contentTextFi)

  await page.getByTestId('tab-sv').click()

  await page.getByLabel('form.tehtavannimi').fill(nameTextSv)
  await page.getByLabel('form.tehtavansisalto').fill(contentTextSv)
}
