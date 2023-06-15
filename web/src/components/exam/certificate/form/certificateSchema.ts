import { ErrorMessages } from '../../../../types'

const MIN_LENGTH = 3
import { z } from 'zod'

export const certificateSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: ErrorMessages.REQUIRED }),
  nameFi: z
    .string()
    .refine((val) => val !== '', { message: ErrorMessages.REQUIRED })
    .refine((val) => val.length >= MIN_LENGTH, { message: ErrorMessages.SHORT }),
  contentFi: z.string().refine((val) => val !== '', { message: ErrorMessages.REQUIRED }),
  fileName: z.string(),
  fileKey: z.string({ required_error: ErrorMessages.NO_FILE }),
  fileUploadDate: z.string()
})

export type CertificateFormType = z.infer<typeof certificateSchema>
