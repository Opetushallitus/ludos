import { z } from 'zod'
import { ErrorMessages } from '../../../../types'

export const MIN_LENGTH = 3

const commonSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: ErrorMessages.REQUIRED }),
  nameFi: z
    .string()
    .refine((val) => val !== '', { message: ErrorMessages.REQUIRED })
    .refine((val) => val.length >= MIN_LENGTH, { message: ErrorMessages.SHORT }),
  nameSv: z.string().nullable(),
  instructionFi: z.string().nullable(),
  instructionSv: z.string().nullable(),
  contentFi: z.string().refine((val) => val !== '', { message: ErrorMessages.REQUIRED }),
  contentSv: z.string().nullable(),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string()).nullable()
})

export const sukoAssignmentSchema = commonSchema.merge(
  z.object({
    assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    oppimaaraKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    tavoitetasoKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    aiheKoodiArvos: z.array(z.string()).nullable()
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
