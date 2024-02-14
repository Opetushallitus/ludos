import { ErrorMessages, Exam, PublishState } from '../../../types'
import { z } from 'zod'
import { examEnumZodType, inputNotEmptyValidation, nameValidation, publishStateEnumZodType } from './schemaCommon'

export const isSukoCertificateValues = (values: AnyCertificateFormType): values is SukoCertificateFormType =>
  values.exam === Exam.SUKO

export const isLdCertificateValues = (values: AnyCertificateFormType): values is LdCertificateFormType =>
  values.exam === Exam.LD

export const isPuhviCertificateValues = (values: AnyCertificateFormType): values is PuhviCertificateFormType =>
  values.exam === Exam.PUHVI

const attachmentSchema = z.object(
  {
    fileName: z.string(),
    fileKey: z.string(),
    fileUploadDate: z.string().optional(),
    name: z.string().optional(),
    language: z.enum(['FI', 'SV']).optional(),
    size: z.number().optional()
  },
  { required_error: ErrorMessages.REQUIRED, invalid_type_error: ErrorMessages.REQUIRED }
)

export type AttachmentFormType = z.infer<typeof attachmentSchema>

const commonCertificateSchema = z.object({
  exam: examEnumZodType,
  publishState: publishStateEnumZodType,
  nameFi: nameValidation,
  attachmentFi: attachmentSchema
})

export type CommonCertificateFormType = z.infer<typeof commonCertificateSchema>

const sukoCertificateSchema = commonCertificateSchema.merge(
  z.object({
    nameSv: z.string().min(0).max(0),
    descriptionFi: inputNotEmptyValidation,
    descriptionSv: z.string().min(0).max(0)
  })
)

export type SukoCertificateFormType = z.infer<typeof sukoCertificateSchema>

const ldCertificateSchema = commonCertificateSchema.merge(
  z.object({
    nameSv: nameValidation,
    descriptionFi: z.string().min(0).max(0).default(''),
    descriptionSv: z.string().min(0).max(0).default(''),
    aineKoodiArvo: inputNotEmptyValidation,
    attachmentSv: attachmentSchema
  })
)

export type LdCertificateFormType = z.infer<typeof ldCertificateSchema>

const puhviCertificateSchema = commonCertificateSchema.merge(
  z.object({
    nameSv: inputNotEmptyValidation,
    descriptionFi: inputNotEmptyValidation,
    descriptionSv: inputNotEmptyValidation,
    attachmentSv: attachmentSchema
  })
)

export type PuhviCertificateFormType = z.infer<typeof puhviCertificateSchema>

export type AnyCertificateFormType = SukoCertificateFormType | LdCertificateFormType | PuhviCertificateFormType

export const certificateSchemaByExam = {
  [Exam.SUKO]: sukoCertificateSchema,
  [Exam.LD]: ldCertificateSchema,
  [Exam.PUHVI]: puhviCertificateSchema
}

const commonDefaultValues = {
  publishState: PublishState.Published,
  nameFi: '',
  nameSv: '',
  descriptionFi: '',
  descriptionSv: ''
}

const sukoDefaultValues: Partial<SukoCertificateFormType> = {
  ...commonDefaultValues,
  exam: Exam.SUKO
}

const ldDefaultValues: Partial<LdCertificateFormType> = {
  ...commonDefaultValues,
  exam: Exam.LD,
  aineKoodiArvo: ''
}

const puhviDefaultValues: Partial<PuhviCertificateFormType> = {
  ...commonDefaultValues,
  exam: Exam.PUHVI
}

export const defaultValuesByExam = {
  [Exam.SUKO]: sukoDefaultValues,
  [Exam.LD]: ldDefaultValues,
  [Exam.PUHVI]: puhviDefaultValues
}
