import { BrowserContext, expect, Page } from '@playwright/test'
import {
  AnyCertificateFormType,
  AttachmentFormType,
  isLdCertificateValues,
  isPuhviCertificateValues,
  isSukoCertificateValues
} from 'web/src/components/forms/schemas/certificateSchema'
import { KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel, selectAttachmentFile, setSingleSelectDropdownOption } from '../helpers'
import { CertificateFormModel } from '../models/CertificateFormModel'

export async function fillCertificateForm(form: CertificateFormModel, inputs: AnyCertificateFormType) {
  const isSuko = isSukoCertificateValues(inputs)
  const isPuhvi = isPuhviCertificateValues(inputs)
  const isSukoOrLd = isSuko || isPuhvi

  if (isLdCertificateValues(inputs)) {
    await setSingleSelectDropdownOption(form.page, 'aineKoodiArvo', inputs.aineKoodiArvo)
  }
  await form.nameFi.fill(inputs.nameFi)
  if (isSukoOrLd) {
    await form.descriptionFi.fill(inputs.descriptionFi)
  }
  await selectAttachmentFile(form.page, inputs.attachmentFi.name!, form.attachmentInputFi)

  if (isLdCertificateValues(inputs) || isPuhviCertificateValues(inputs)) {
    await form.tabSv.click()

    await form.nameSv.fill(inputs.nameSv)
    await selectAttachmentFile(form.page, inputs.attachmentSv.name!, form.attachmentInputSv)

    if (isPuhviCertificateValues(inputs)) {
      await form.descriptionSv.fill(inputs.descriptionSv)
    }
  }
}

export async function testAttachmentLink(page: Page, context: BrowserContext, attachment: AttachmentFormType) {
  const attachmentLink = page.getByRole('link', { name: `${attachment.name}` })
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
  const header = page.getByTestId('assignment-header')
  await expect(header).toHaveText(inputs.nameFi)

  if (isLdCertificateValues(inputs)) {
    await expect(page.getByTestId('certificate-aine')).toHaveText(
      await koodiLabel(KoodistoName.LUDOS_LUKIODIPLOMI_AINE, inputs.aineKoodiArvo)
    )
  } else {
    await expect(page.getByText(inputs.descriptionFi, { exact: true })).toBeVisible()
  }

  if (isPuhviCertificateValues(inputs) || isLdCertificateValues(inputs)) {
    const attachment = await page.getByTestId(inputs.attachmentFi.name!).allTextContents()
    expect(attachment[0]).toContain(inputs.attachmentSv.name)
  } else {
    await expect(page.getByText(inputs.descriptionFi, { exact: true })).toBeVisible()
  }

  await expect(page.getByText(action === 'submit' ? 'state.julkaistu' : 'state.luonnos', { exact: true })).toBeVisible()

  await testAttachmentLink(page, context, inputs.attachmentFi)
}
