const MIN_LENGTH = 3
import { z } from 'zod'

export const certificateSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  examType: z.enum(['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES'], { required_error: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  nameSv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  contentFi: z.string().nullable(),
  contentSv: z.string().nullable()
})

export type CertificateFormType = z.infer<typeof certificateSchema>
