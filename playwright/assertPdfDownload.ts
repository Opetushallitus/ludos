import { expect, Locator, Page } from '@playwright/test'
import pdf from 'pdf-parse'
import fs from 'fs'
import path from 'path'

export async function assertPDFDownload(
  page: Page,
  buttonLocator: Locator,
  expectedFileTitle: string,
  expectedText: string
) {
  await expect(buttonLocator).toBeVisible()

  const tempDir = fs.mkdtempSync(path.join(__dirname, 'temp_folder_for_tests_'))

  const [download] = await Promise.all([page.waitForEvent('download'), buttonLocator.click()])

  const filename = download.suggestedFilename()
  expect(filename).toBe(`${expectedFileTitle}.pdf`)

  const tempPath = path.join(tempDir, filename)
  await download.saveAs(tempPath)

  const fileSizeInBytes = fs.statSync(tempPath).size
  expect(fileSizeInBytes).toBeGreaterThan(100)
  expect(fileSizeInBytes).toBeLessThan(200000)

  const data = await pdf(fs.readFileSync(tempPath))
  expect(data.numpages).toBe(1)
  expect(data.info.Title).toBe(expectedFileTitle)

  const cleanedText = data.text.replaceAll('\n', ' ')
  expect(cleanedText).toContain(expectedText)

  fs.unlinkSync(tempPath)
  fs.rmdirSync(tempDir)
}
