const MIN_LENGTH = 3
import { z } from 'zod'

export const certificateSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  contentFi: z.string().nullable(),
  fileName: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  fileUrl: z.string(),
  fileUploadDate: z.string()
})

export type CertificateFormType = z.infer<typeof certificateSchema>
