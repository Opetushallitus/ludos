import { RefinementCtx, z } from 'zod'
import { ErrorMessages, Exam } from '../../../types'
import { examEnumZodType, MIN_NAME_LENGTH, publishStateEnumZodType, validateImgTagsInArray } from './schemaCommon'

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
  exam: examEnumZodType,
  publishState: publishStateEnumZodType,
  nameFi: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  nameSv: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
  instructionFi: z.string().default(''),
  instructionSv: z.string().default(''),
  contentFi: z
    .array(z.string())
    .optional()
    .default([''])
    .refine((htmlStringArray) => validateImgTagsInArray(htmlStringArray), {
      message: ErrorMessages.REQUIRED_IMG_ALT
    }),
  contentSv: z
    .array(z.string())
    .optional()
    .default([''])
    .refine((htmlStringArray) => validateImgTagsInArray(htmlStringArray), {
      message: ErrorMessages.REQUIRED_IMG_ALT
    }),
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

export type AnyAssignmentFormType = SukoAssignmentFormType | LdAssignmentFormType | PuhviAssignmentFormType

export function isSukoAssignmentFormType(formData: AnyAssignmentFormType): formData is SukoAssignmentFormType {
  return formData.exam === Exam.SUKO
}

export function isLdAssignmentFormType(formData: AnyAssignmentFormType): formData is LdAssignmentFormType {
  return formData.exam === Exam.LD
}

export function isPuhviAssignmentFormType(formData: AnyAssignmentFormType): formData is PuhviAssignmentFormType {
  return formData.exam === Exam.PUHVI
}

export const assignmentSchemaByExam = {
  [Exam.SUKO]: sukoAssignmentSchema,
  [Exam.LD]: ldAssignmentSchema,
  [Exam.PUHVI]: puhviAssignmentSchema
}

const commonSchemaDefaultValues: Partial<CommonAssignmentFormType> = {
  nameFi: '',
  nameSv: '',
  instructionFi: '',
  instructionSv: '',
  contentFi: [''],
  contentSv: [''],
  laajaalainenOsaaminenKoodiArvos: []
}

export const assignmentDefaultValuesByExam = {
  [Exam.SUKO]: {
    ...commonSchemaDefaultValues,
    exam: Exam.SUKO,
    assignmentTypeKoodiArvo: '',
    oppimaara: null,
    tavoitetasoKoodiArvo: null,
    aiheKoodiArvos: []
  },
  [Exam.LD]: {
    ...commonSchemaDefaultValues,
    exam: Exam.LD,
    aineKoodiArvo: '',
    lukuvuosiKoodiArvos: []
  },
  [Exam.PUHVI]: {
    ...commonSchemaDefaultValues,
    exam: Exam.PUHVI,
    assignmentTypeKoodiArvo: '',
    lukuvuosiKoodiArvos: []
  }
}
