import { BrowserContext, expect, Page } from '@playwright/test'
import { Exam, KoodistoName } from 'web/src/types'
import { FormAction, koodiLabel, setSingleSelectDropdownOption } from '../../helpers'
import path from 'path'
import { AttachmentFormType, CertificateFormType } from 'web/src/components/forms/schemas/certificateSchema'

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

const attachment1: AttachmentFormType = {
  name: 'fixture1.pdf',
  size: 323,
  fileName: 'fixture1.pdf',
  fileKey: '123-123'
}

const attachment2: AttachmentFormType = {
  name: 'fixture2.pdf',
  size: 331,
  fileName: 'fixture2.pdf',
  fileKey: '123-123'
}

export const createCertificateInputs = (exam: Exam, action: FormAction): CertificateFormType => ({
  exam: exam,
  nameFi: certificateNameByAction(action),
  nameSv: `${certificateNameByAction(action)} sv`,
  descriptionFi: 'Todistuksen kuvaus FI',
  descriptionSv: 'Todistuksen kuvaus SV',
  attachmentFi: attachment1,
  attachmentSv: attachment1,
  aineKoodiArvo: '9'
})

export const updateCertificateInputs = (exam: Exam, action: FormAction): CertificateFormType => ({
  exam: exam,
  nameFi: `${certificateNameByAction(action)} updated`,
  nameSv: `${certificateNameByAction(action)} sv updated`,
  descriptionFi: 'Todistuksen kuvaus FI updated',
  descriptionSv: 'Todistuksen kuvaus SV updated',
  attachmentFi: attachment2,
  attachmentSv: attachment2,
  aineKoodiArvo: '9'
})

export async function fillCertificateForm(page: Page, exam: Exam, inputs: CertificateFormType) {
  const isSuko = exam === Exam.SUKO
  const isLd = exam === Exam.LD
  const isPuhvi = exam === Exam.PUHVI
  const isSukoOrLd = isSuko || isPuhvi

  isLd && (await setSingleSelectDropdownOption(page, 'aineKoodiArvo', inputs.aineKoodiArvo!))
  await page.getByTestId('nameFi').fill(inputs.nameFi)
  isSukoOrLd && (await page.getByTestId('descriptionFi').fill(inputs.descriptionFi!))
  await selectAttachmentFile(page, inputs.attachmentFi.name!)

  if (!isSuko) {
    await page.getByTestId('tab-sv').click()

    await page.getByTestId('nameSv').fill(inputs.nameSv!)
    await selectAttachmentFile(page, inputs.attachmentSv!.name!, 'sv')

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
