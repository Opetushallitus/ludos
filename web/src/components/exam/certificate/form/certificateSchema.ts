import { ErrorMessages } from '../../../../types'

const MIN_LENGTH = 3
import { z } from 'zod'

export const certificateSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: ErrorMessages.REQUIRED }),
  name: z
    .string()
    .refine((val) => val !== '', { message: ErrorMessages.REQUIRED })
    .refine((val) => val.length >= MIN_LENGTH, { message: ErrorMessages.SHORT }),
  description: z.string().refine((val) => val !== '', { message: ErrorMessages.REQUIRED }),
  certificateHasAttachment: z.boolean().refine((val) => val === true, ErrorMessages.NO_FILE)
})

export type CertificateFormType = z.infer<typeof certificateSchema>
