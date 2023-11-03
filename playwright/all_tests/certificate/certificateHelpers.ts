import { BrowserContext, expect, Page } from '@playwright/test'
import { Exam, KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel } from '../../helpers'
import path from 'path'

function certificateNameByAction(action: FormAction): string {
  switch (action) {
    case 'submit':
      return 'Testi todistus'
    case 'draft':
      return 'Testi todistus draft'
    case 'cancel':
      return 'Testi todistus cancel'
    case 'delete':
      return 'Testi todistus delete'
  }
}

const attachment1 = {
  name: 'fixture1.pdf',
  size: 323
}

const attachment2 = {
  name: 'fixture2.pdf',
  size: 331
}

export type CertificateInput = {
  nameFi: string
  nameSv: string
  aineKoodiArvo: string
  descriptionFi: string
  descriptionSv: string
  fixtureFi: { size: number; name: string }
  fixtureSv: { size: number; name: string }
}

export const createCertificateInputs = (action: FormAction): CertificateInput => ({
  nameFi: certificateNameByAction(action),
  nameSv: `${certificateNameByAction(action)} sv`,
  descriptionFi: 'Todistuksen kuvaus FI',
  descriptionSv: 'Todistuksen kuvaus SV',
  fixtureFi: attachment1,
  fixtureSv: attachment1,
  aineKoodiArvo: '9'
})

export const updateCertificateInputs = (action: FormAction): CertificateInput => ({
  nameFi: `${certificateNameByAction(action)} updated`,
  nameSv: `${certificateNameByAction(action)} sv updated`,
  descriptionFi: 'Todistuksen kuvaus FI updated',
  descriptionSv: 'Todistuksen kuvaus SV updated',
  fixtureFi: attachment2,
  fixtureSv: attachment2,
  aineKoodiArvo: '9'
})

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
  inputs: CertificateInput,
  action: FormAction
) {
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(inputs.nameFi)

  if (exam === Exam.LD) {
    await expect(page.getByTestId('certificate-aine')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, inputs.aineKoodiArvo)
    )
  } else {
    await expect(page.getByText(inputs.descriptionFi, { exact: true })).toBeVisible()
  }

  const attachment = await page.getByTestId(inputs.fixtureFi.name).allTextContents()
  expect(attachment[0]).toContain(inputs.fixtureFi.name)

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, inputs.fixtureFi)
}

export async function selectAttachmentFile(page: Page, file: string, language: 'fi' | 'sv' = 'fi') {
  const filePath = path.resolve(__dirname, `../../../server/src/main/resources/fixtures/${file}`)

  await page.locator(`#fileInput-${language}`).setInputFiles(filePath)

  const currentDate = new Date()

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const formattedDate = `${day}.${month}.${year}`

  await expect(page.getByTestId(file).first()).toHaveText(`${file}${formattedDate}`)
}
