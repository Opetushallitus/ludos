import { RefinementCtx, z } from 'zod'
import { ErrorMessages, Exam, PublishState } from '../../../types'
import {
  examEnumZodType,
  inputNotEmptyValidation,
  nameOrEmptyStringValidation,
  publishStateEnumZodType,
  validateImgTagsInArray
} from './schemaCommon'

export const commonSuperRefine = ({ nameFi, nameSv }: { nameFi: string; nameSv: string }, ctx: RefinementCtx) => {
  // Either nameFi or nameSv has a length of at least 1, but not both
  if (nameFi.trim().length === 0 && nameSv.trim().length === 0) {
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
  nameFi: nameOrEmptyStringValidation,
  nameSv: nameOrEmptyStringValidation,
  instructionFi: z.string(),
  instructionSv: z.string(),
  contentFi: z
    .array(z.string())
    .optional()
    .refine((htmlStringArray) => validateImgTagsInArray(htmlStringArray), {
      message: ErrorMessages.REQUIRED_IMG_ALT
    }),
  contentSv: z
    .array(z.string())
    .optional()
    .refine((htmlStringArray) => validateImgTagsInArray(htmlStringArray), {
      message: ErrorMessages.REQUIRED_IMG_ALT
    }),
  laajaalainenOsaaminenKoodiArvos: z.array(z.string())
})

export type CommonAssignmentFormType = z.infer<typeof commonSchema>

export const sukoAssignmentSchema = commonSchema
  .merge(
    z.object({
      nameSv: z.string().refine((val) => val.trim().length === 0),
      assignmentTypeKoodiArvo: inputNotEmptyValidation,
      oppimaara: z.object(
        {
          oppimaaraKoodiArvo: inputNotEmptyValidation,
          kielitarjontaKoodiArvo: z.string().nullable().default(null)
        },
        { required_error: ErrorMessages.REQUIRED }
      ),
      tavoitetasoKoodiArvo: z.string().nullable(),
      aiheKoodiArvos: z.array(z.string())
    })
  )
  .superRefine(commonSuperRefine)

export type SukoAssignmentFormType = z.infer<typeof sukoAssignmentSchema>

export const ldAssignmentSchema = commonSchema
  .merge(
    z.object({
      aineKoodiArvo: inputNotEmptyValidation,
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
      assignmentTypeKoodiArvo: inputNotEmptyValidation,
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
  publishState: PublishState.Published,
  nameFi: '',
  nameSv: '',
  instructionFi: '',
  instructionSv: '',
  contentFi: [''],
  contentSv: [''],
  laajaalainenOsaaminenKoodiArvos: []
}

const sukoDefaultValues: Partial<SukoAssignmentFormType> = {
  ...commonSchemaDefaultValues,
  exam: Exam.SUKO,
  assignmentTypeKoodiArvo: '',
  tavoitetasoKoodiArvo: null,
  aiheKoodiArvos: []
}

const ldDefaultValues: Partial<LdAssignmentFormType> = {
  ...commonSchemaDefaultValues,
  exam: Exam.LD,
  aineKoodiArvo: '',
  lukuvuosiKoodiArvos: []
}

const puhviDefaultValues: Partial<PuhviAssignmentFormType> = {
  ...commonSchemaDefaultValues,
  exam: Exam.PUHVI,
  assignmentTypeKoodiArvo: '',
  lukuvuosiKoodiArvos: []
}

export const assignmentDefaultValuesByExam = {
  [Exam.SUKO]: sukoDefaultValues,
  [Exam.LD]: ldDefaultValues,
  [Exam.PUHVI]: puhviDefaultValues
}
