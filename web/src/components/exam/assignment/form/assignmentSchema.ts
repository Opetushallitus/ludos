const MIN_LENGTH = 3
import { z } from 'zod'

export const assignmentSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  contentType: z.string({ required_error: 'Required' }),
  assignmentTypeKoodiArvo: z.string({ required_error: 'Required' }),
  oppimaaraKoodiArvo: z.string({ required_error: 'Required' }),
  tavoitetasoKoodiArvo: z.string({ required_error: 'Required' }),
  aiheKoodiArvo: z.array(z.string()).min(1, { message: 'Required' }),
  laajaalainenOsaaminenKoodiArvo: z.array(z.string()).min(1, { message: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  nameSv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  contentFi: z.string().nullable(),
  contentSv: z.string().nullable()
})

export type AssignmentFormType = z.infer<typeof assignmentSchema>
