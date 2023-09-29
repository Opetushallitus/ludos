import { ErrorMessages, Exam, PublishState } from '../../../../types'
import { z } from 'zod'

const MIN_LENGTH = 3

export const certificateSchema = z.object({
  exam: z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED }),
  publishState: z.enum([PublishState.Published, PublishState.Draft, PublishState.Archived]).optional(),
  name: z
    .string()
    .refine((val) => val !== '', { message: ErrorMessages.REQUIRED })
    .refine((val) => val.length >= MIN_LENGTH, { message: ErrorMessages.SHORT }),
  description: z.string(),
  attachment: z.object(
    {
      fileName: z.string(),
      fileKey: z.string(),
      fileUploadDate: z.string().optional(),
      name: z.string().optional(),
      language: z.enum(['FI', 'SV']).optional()
    },
    { required_error: ErrorMessages.REQUIRED }
  )
})

export type CertificateFormType = z.infer<typeof certificateSchema>
