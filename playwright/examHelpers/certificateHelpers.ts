import { BrowserContext, expect, Page } from '@playwright/test'
import { Exam, KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel, selectAttachmentFile, setSingleSelectDropdownOption } from '../helpers'
import { AttachmentFormType, CertificateFormType } from 'web/src/components/forms/schemas/certificateSchema'

export async function fillCertificateForm(page: Page, exam: Exam, inputs: CertificateFormType) {
  const isSuko = exam === Exam.SUKO
  const isLd = exam === Exam.LD
  const isPuhvi = exam === Exam.PUHVI
  const isSukoOrLd = isSuko || isPuhvi

  isLd && (await setSingleSelectDropdownOption(page, 'aineKoodiArvo', inputs.aineKoodiArvo!))
  await page.getByTestId('nameFi').fill(inputs.nameFi)
  isSukoOrLd && (await page.getByTestId('descriptionFi').fill(inputs.descriptionFi!))
  await selectAttachmentFile(page, inputs.attachmentFi.name!, page.getByTestId('file-input-fi'))

  if (!isSuko) {
    await page.getByTestId('tab-sv').click()

    await page.getByTestId('nameSv').fill(inputs.nameSv!)
    await selectAttachmentFile(page, inputs.attachmentSv!.name!, page.getByTestId('file-input-sv'))

    isPuhvi && (await page.getByTestId('descriptionSv').fill(inputs.descriptionSv!))
  }
}

export async function testAttachmentLink(page: Page, context: BrowserContext, attachment: AttachmentFormType) {
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
  inputs: CertificateFormType,
  action: FormAction
) {
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(inputs.nameFi)

  if (exam === Exam.LD) {
    await expect(page.getByTestId('certificate-aine')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, inputs.aineKoodiArvo!)
    )
  } else {
    await expect(page.getByText(inputs.descriptionFi!, { exact: true })).toBeVisible()
  }

  const attachment = await page.getByTestId(inputs.attachmentFi.name!).allTextContents()
  expect(attachment[0]).toContain(inputs.attachmentSv!.name)

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, inputs.attachmentFi)
}
