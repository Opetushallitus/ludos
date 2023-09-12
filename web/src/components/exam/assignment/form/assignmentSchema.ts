import { RefinementCtx, z } from 'zod'
import { ErrorMessages } from '../../../../types'

export const MIN_LENGTH = 3

export const commonSuperRefine = ({ nameFi, nameSv }: { nameFi: string; nameSv: string }, ctx: RefinementCtx) => {
  // Either nameFi or nameSv has a length of at least 1, but not both
  if (nameFi.length === 0 && nameSv.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ErrorMessages.ASSIGNMENT_NAME_REQUIRED,
      path: ['nameRequired']
    })
  }
}

const commonSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: ErrorMessages.REQUIRED }),
  nameFi: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  nameSv: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  instructionFi: z.string(),
  instructionSv: z.string(),
  contentFi: z.array(z.string()).optional().default(['']),
  contentSv: z.array(z.string()).optional().default(['']),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string())
})

export const sukoAssignmentSchema = commonSchema
  .merge(
    z.object({
      assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
      oppimaaraKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
      tavoitetasoKoodiArvo: z.string().nullable().default(null),
      aiheKoodiArvos: z.array(z.string())
    })
  )
  .superRefine(commonSuperRefine)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const ldAssignmentSchema = commonSchema.merge(
  z.object({
    aineKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
    lukuvuosiKoodiArvos: z.array(z.string(), { required_error: ErrorMessages.REQUIRED }).min(1, ErrorMessages.REQUIRED)
  })
)

export type LdAssignmentFormType = z.infer<typeof ldAssignmentSchema>

export const puhviAssignmentSchema = commonSchema
  .merge(
    z.object({
      assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
      lukuvuosiKoodiArvos: z
        .array(z.string(), { required_error: ErrorMessages.REQUIRED })
        .min(1, ErrorMessages.REQUIRED)
    })
  )
  .superRefine(commonSuperRefine)

export type PuhviAssignmentFormType = z.infer<typeof puhviAssignmentSchema>
