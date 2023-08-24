import { Page } from '@playwright/test'
import path from 'path'

export async function fillInstructionForm({
  page,
  contentTextFi,
  contentTextSv,
  nameTextFi,
  nameTextSv,
  shortDescriptionFi,
  shortDescriptionSv,
  attachmentNameFi,
  attachmentNameSv
}: {
  page: Page
  nameTextFi?: string
  nameTextSv?: string
  contentTextFi?: string
  contentTextSv?: string
  shortDescriptionFi?: string
  shortDescriptionSv?: string
  attachmentNameFi?: string
  attachmentNameSv?: string
}) {
  // check that form is loaded
  await page.getByTestId('heading').click()

  if (nameTextFi) {
    await page.getByTestId('nameFi').fill(nameTextFi)
  }
  if (contentTextFi) {
    await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill(contentTextFi)
  }
  if (shortDescriptionFi) {
    await page.getByTestId('shortDescriptionFi').fill(shortDescriptionFi)
  }

  const files = ['fixture1.pdf', 'fixture2.pdf']

  const filePaths = files.map((file) => path.resolve(__dirname, `../../../server/src/main/resources/fixtures/${file}`))

  if (attachmentNameFi) {
    for (const filePath of filePaths) {
      await page.locator('#fileInput-fi').setInputFiles(filePath)
    }
    for (const [index] of files.entries()) {
      await page.getByTestId(`attachment-name-input-${index}-fi`).fill(`${attachmentNameFi} ${index + 1}`)
    }
  }

  const hasSvFields = nameTextSv || contentTextSv || shortDescriptionSv || attachmentNameSv

  if (hasSvFields) {
    await page.getByTestId('tab-sv').click()
    if (nameTextSv) {
      await page.getByTestId('nameSv').fill(nameTextSv)
    }
    if (contentTextSv) {
      await page.getByTestId('editor-content-sv').locator('div[contenteditable="true"]').fill(contentTextSv)
    }
    if (shortDescriptionSv) {
      await page.getByTestId('shortDescriptionSv').fill(shortDescriptionSv)
    }

    if (attachmentNameSv) {
      for (const filePath of filePaths) {
        await page.locator('#fileInput-sv').setInputFiles(filePath)
      }
      for (const [index] of files.entries()) {
        await page.getByTestId(`attachment-name-input-${index}-sv`).fill(`${attachmentNameSv} ${index + 1}`)
      }
    }
  }
}
