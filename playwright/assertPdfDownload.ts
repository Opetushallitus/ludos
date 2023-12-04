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

  const path = await download.path()
  const stats = fs.statSync(path)
  const fileSizeInBytes = stats.size

  expect(fileSizeInBytes).toBeGreaterThan(100)
  expect(fileSizeInBytes).toBeLessThan(200000)

  const dataBuffer = fs.readFileSync(path)

  const data = await pdf(dataBuffer)

  expect(data.numpages).toBe(1)
  expect(data.info.Title).toBe(expectedFileTitle)

  const cleanedText = data.text.replaceAll('\n', ' ')
  expect(cleanedText).toContain(expectedText)
}
