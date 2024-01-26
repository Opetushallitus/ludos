import { expect, Locator, Page } from '@playwright/test'
import pdf from 'pdf-parse'
import fs from 'fs'

export async function assertPDFDownload(
  page: Page,
  buttonLocator: Locator,
  expectedFileTitle: string,
  expectedText: string
) {
  await expect(buttonLocator).toBeVisible()

  const [download] = await Promise.all([page.waitForEvent('download'), buttonLocator.click()])

  const filename = download.suggestedFilename()
  expect(filename).toBe(`${expectedFileTitle}.pdf`)

  const tempPath = `temp_folder_for_tests/${filename}`
  await download.saveAs(tempPath)

  const fileSizeInBytes = fs.statSync(tempPath).size

  expect(fileSizeInBytes).toBeGreaterThan(100)
  expect(fileSizeInBytes).toBeLessThan(200000)

  const data = await pdf(fs.readFileSync(tempPath))

  expect(data.numpages).toBe(1)
  expect(data.info.Title).toBe(expectedFileTitle)

  const cleanedText = data.text.replaceAll('\n', ' ')
  expect(cleanedText).toContain(expectedText)

  // poista tiedosto
  fs.unlinkSync(tempPath)
}
