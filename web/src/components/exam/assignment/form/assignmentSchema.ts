import { z } from 'zod'

const MIN_LENGTH = 3

const commonSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  contentType: z.string({ required_error: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  nameSv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  instructionFi: z.string().nullable(),
  instructionSv: z.string().nullable(),
  contentFi: z.string().nullable(),
  contentSv: z.string().nullable()
})

export const sukoAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: 'Required' }),
    oppimaaraKoodiArvo: z.string({ required_error: 'Required' }),
    tavoitetasoKoodiArvo: z.string({ required_error: 'Required' }),
    aiheKoodiArvo: z.array(z.string()).min(1, { message: 'Required' }),
    laajaalainenOsaaminenKoodiArvo: z.array(z.string()).min(1, { message: 'Required' })
  })
)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const puhviAndLdAssignmentSchema = commonSchema.merge(
  z.object({
    laajaalainenOsaaminenKoodiArvo: z.array(z.string()).min(1, { message: 'Required' }),
    lukuvuosiKoodiArvo: z.string({ required_error: 'Required' })
  })
)

export type PuhviAndLdAssignmentFormType = z.infer<typeof puhviAndLdAssignmentSchema>
