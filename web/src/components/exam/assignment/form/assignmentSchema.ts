import { z } from 'zod'

const MIN_LENGTH = 3

const commonSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  nameSv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  instructionFi: z.string().nullable(),
  instructionSv: z.string().nullable(),
  contentFi: z.string().nullable(),
  contentSv: z.string().nullable(),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string())
})

export const sukoAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: 'Required' }),
    oppimaaraKoodiArvo: z.string({ required_error: 'Required' }),
    tavoitetasoKoodiArvo: z.string({ required_error: 'Required' }),
    aiheKoodiArvos: z.array(z.string())
  })
)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const LdAssignmentSchema = commonSchema.merge(
  z.object({
    aineKoodiArvo: z.string({ required_error: 'Required' }),
    lukuvuosiKoodiArvos: z.array(z.string())
  })
)

export type LdAssignmentFormType = z.infer<typeof LdAssignmentSchema>

export const PuhviAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: 'Required' }),
    lukuvuosiKoodiArvos: z.array(z.string())
  })
)

export type PuhviAssignmentFormType = z.infer<typeof PuhviAssignmentSchema>
