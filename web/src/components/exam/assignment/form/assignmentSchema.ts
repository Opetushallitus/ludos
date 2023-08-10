import { z } from 'zod'
import { ErrorMessages } from '../../../../types'

export const MIN_LENGTH = 3

const commonSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: ErrorMessages.REQUIRED }),
  nameFi: z.string(),
  nameSv: z.string(),
  instructionFi: z.string(),
  instructionSv: z.string(),
  contentFi: z.string(),
  contentSv: z.string(),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string())
})

export const sukoAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    oppimaaraKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    tavoitetasoKoodiArvo: z.string().nullable().default(null),
    aiheKoodiArvos: z.array(z.string())
  })
)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const LdAssignmentSchema = commonSchema.merge(
  z.object({
    aineKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    lukuvuosiKoodiArvos: z.array(z.string(), { required_error: ErrorMessages.REQUIRED }).min(1, ErrorMessages.REQUIRED)
  })
)

export type LdAssignmentFormType = z.infer<typeof LdAssignmentSchema>

export const PuhviAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    lukuvuosiKoodiArvos: z.array(z.string(), { required_error: ErrorMessages.REQUIRED }).min(1, ErrorMessages.REQUIRED)
  })
)

export type PuhviAssignmentFormType = z.infer<typeof PuhviAssignmentSchema>
