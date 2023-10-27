import { BrowserContext, expect, Page } from '@playwright/test'
import { Exam, KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel } from '../../helpers'
import path from 'path'

export async function testAttachmentLink(
  page: Page,
  context: BrowserContext,
  attachment: { name: string; size: number }
) {
  const attachmentLink = page.getByRole('link', { name: `${attachment.name} open_in_new` })
  const attachmentLinkTarget = await attachmentLink.evaluate((l) => l.getAttribute('target'))
  const attachmentLinkHref = await attachmentLink.evaluate((l) => l.getAttribute('href'))

  expect(attachmentLinkTarget).toBe('_blank')
  expect(attachmentLinkHref).not.toBeNull()

  const attachmentResponse = await context.request.get(attachmentLinkHref!)
  expect(attachmentResponse.status()).toBe(200)
  expect(attachmentResponse.headers()['content-type']).toBe('application/pdf')
  expect(attachmentResponse.headers()['content-disposition']).toBe(`inline; filename="${attachment.name}"`)
  expect(Buffer.byteLength(await attachmentResponse.body())).toBe(attachment.size)
}

export async function assertContentPage(
  page: Page,
  context: BrowserContext,
  exam: Exam,
  action: FormAction,
  nameText: string,
  descriptionText: string,
  expectedAttachment: {
    name: string
    size: number
  }
) {
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(nameText)

  if (exam === Exam.LD) {
    await expect(page.getByTestId('certificate-aine')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, '9')
    )
  } else {
    await expect(page.getByText(descriptionText, { exact: true })).toBeVisible()
  }

  const attachment = await page.getByTestId(expectedAttachment.name).allTextContents()
  expect(attachment[0]).toContain(expectedAttachment.name)

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, expectedAttachment)
}

export async function selectAttachmentFile(page: Page, file: string) {
  const filePath = path.resolve(__dirname, `../../../server/src/main/resources/fixtures/${file}`)

  await page.locator('#fileInput-fi').setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file)).toHaveText(`${file}${formattedDate}`)
}
