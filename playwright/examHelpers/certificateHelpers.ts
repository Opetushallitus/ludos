import { BrowserContext, expect, Page } from '@playwright/test'
import { KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel, selectAttachmentFile, setSingleSelectDropdownOption } from '../helpers'
import {
  AnyCertificateFormType,
  AttachmentFormType,
  isLdCertificateValues,
  isPuhviCertificateValues,
  isSukoCertificateValues
} from 'web/src/components/forms/schemas/certificateSchema'
import { CertificateFormModel } from '../models/CertificateFormModel'

export async function fillCertificateForm(form: CertificateFormModel, inputs: AnyCertificateFormType) {
  const isSuko = isSukoCertificateValues(inputs)
  const isLd = isLdCertificateValues(inputs)
  const isPuhvi = isPuhviCertificateValues(inputs)
  const isSukoOrLd = isSuko || isPuhvi

  isLd && (await setSingleSelectDropdownOption(form.page, 'aineKoodiArvo', inputs.aineKoodiArvo!))
  await form.nameFi.fill(inputs.nameFi)
  isSukoOrLd && (await form.descriptionFi.fill(inputs.descriptionFi))
  await selectAttachmentFile(form.page, inputs.attachmentFi.name!, form.attachmentInputFi)

  if (isLd || isPuhvi) {
    await form.tabSv.click()

    await form.nameSv.fill(inputs.nameSv)
    await selectAttachmentFile(form.page, inputs.attachmentSv.name!, form.attachmentInputSv)

    isPuhvi && (await form.descriptionSv.fill(inputs.descriptionSv))
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
  inputs: AnyCertificateFormType,
  action: FormAction
) {
  const isLd = isLdCertificateValues(inputs)
  const isPuhvi = isPuhviCertificateValues(inputs)

  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(inputs.nameFi)

  if (isLd) {
    await expect(page.getByTestId('certificate-aine')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, inputs.aineKoodiArvo!)
    )
  } else {
    await expect(page.getByText(inputs.descriptionFi!, { exact: true })).toBeVisible()
  }

  if (isPuhvi || isLd) {
    const attachment = await page.getByTestId(inputs.attachmentFi.name!).allTextContents()
    expect(attachment[0]).toContain(inputs.attachmentSv.name)
  } else {
    await expect(page.getByText(inputs.descriptionFi, { exact: true })).toBeVisible()
  }

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, inputs.attachmentFi)
}
