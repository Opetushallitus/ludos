import { ErrorMessages, Exam } from '../../../types'
import { z } from 'zod'
import { examEnumZodType, MIN_NAME_LENGTH, publishStateEnumZodType } from './schemaCommon'

const attachmentSchema = z.object({
  fileName: z.string(),
  fileKey: z.string(),
  fileUploadDate: z.string().optional(),
  name: z.string().optional(),
  language: z.enum(['FI', 'SV']).optional(),
  size: z.number().optional()
})

export type AttachmentFormType = z.infer<typeof attachmentSchema>

export const certificateSchema = z
  .object({
    exam: examEnumZodType,
    publishState: publishStateEnumZodType,
    nameFi: z
      .string()
      .refine((val) => val !== '', { message: ErrorMessages.REQUIRED })
      .refine((val) => val.length >= MIN_NAME_LENGTH, { message: ErrorMessages.SHORT }),
    nameSv: z.string().optional(),
    descriptionFi: z.string().optional(),
    descriptionSv: z.string().optional(),
    attachmentFi: attachmentSchema,
    attachmentSv: attachmentSchema.optional(),
    aineKoodiArvo: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.exam !== Exam.SUKO) {
      if (!data.nameSv) {
        ctx.addIssue({
          path: ['nameSv'],
          message: ErrorMessages.REQUIRED,
          code: z.ZodIssueCode.custom
        })
      } else if (data.nameSv.length <= MIN_NAME_LENGTH) {
        ctx.addIssue({
          path: ['nameSv'],
          message: ErrorMessages.SHORT,
          code: z.ZodIssueCode.custom
        })
      }

      if (!data.attachmentSv) {
        ctx.addIssue({
          path: ['attachmentSv'],
          message: ErrorMessages.REQUIRED,
          code: z.ZodIssueCode.custom
        })
      }
    }

    if (data.exam === Exam.LD && !data.aineKoodiArvo) {
      ctx.addIssue({
        path: ['aineKoodiArvo'],
        message: ErrorMessages.REQUIRED,
        code: z.ZodIssueCode.custom
      })
    }
  })

export type CertificateFormType = z.infer<typeof certificateSchema>
