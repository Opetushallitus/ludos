import { RefinementCtx, z } from 'zod'
import { ErrorMessages, Exam, PublishState } from '../../../types'

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

const examEnumZodType = z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED })

const commonSchema = z.object({
  exam: examEnumZodType,
  publishState: z.enum([PublishState.Published, PublishState.Draft, PublishState.Deleted]).optional(),
  nameFi: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  nameSv: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  instructionFi: z.string().default(''),
  instructionSv: z.string().default(''),
  contentFi: z.array(z.string()).optional().default(['']),
  contentSv: z.array(z.string()).optional().default(['']),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string()).default([])
})

export type CommonAssignmentFormType = z.infer<typeof commonSchema>

export const sukoAssignmentSchema = commonSchema
  .merge(
    z.object({
      assignmentTypeKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
      oppimaara: z.object(
        {
          oppimaaraKoodiArvo: z.string(),
          kielitarjontaKoodiArvo: z.string().nullable().default(null)
        },
        { required_error: ErrorMessages.REQUIRED }
      ),
      tavoitetasoKoodiArvo: z.string().nullable().default(null),
      aiheKoodiArvos: z.array(z.string()).default([])
    })
  )
  .superRefine(commonSuperRefine)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const ldAssignmentSchema = commonSchema
  .merge(
    z.object({
      aineKoodiArvo: z.string({ required_error: ErrorMessages.REQUIRED }),
      lukuvuosiKoodiArvos: z
        .array(z.string(), { required_error: ErrorMessages.REQUIRED })
        .min(1, ErrorMessages.REQUIRED)
    })
  )
  .superRefine(commonSuperRefine)

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

export const assignmentSchemaByExam = {
  [Exam.SUKO]: sukoAssignmentSchema,
  [Exam.LD]: ldAssignmentSchema,
  [Exam.PUHVI]: puhviAssignmentSchema
}
