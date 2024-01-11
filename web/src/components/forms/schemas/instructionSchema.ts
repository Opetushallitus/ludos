import { z } from 'zod'
import { commonSuperRefine } from './assignmentSchema'
import { ErrorMessages, Exam, PublishState } from '../../../types'
import { MIN_NAME_LENGTH, validateImgTags } from './schemaCommon'

export const instructionSchema = z
  .object({
    exam: z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED }),
    publishState: z.enum([PublishState.Published, PublishState.Draft, PublishState.Deleted]).optional(),
    nameFi: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    nameSv: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    contentFi: z
      .string()
      .default('')
      .refine((htmlString) => validateImgTags(htmlString), {
        message: ErrorMessages.REQUIRED_IMG_ALT
      }),
    contentSv: z
      .string()
      .default('')
      .refine((htmlString) => validateImgTags(htmlString), {
        message: ErrorMessages.REQUIRED_IMG_ALT
      }),
    shortDescriptionFi: z.string().optional(),
    shortDescriptionSv: z.string().optional(),
    nameRequired: z.custom(),
    aineKoodiArvo: z.string().optional()
  })
  .refine((data) => !(data.exam === 'LD' && !data.aineKoodiArvo), {
    message: ErrorMessages.REQUIRED,
    path: ['aineKoodiArvo']
  })
  .superRefine(commonSuperRefine)

export type InstructionFormType = z.infer<typeof instructionSchema>

export const instructionDefaultValues: Partial<InstructionFormType> = {
  nameFi: '',
  nameSv: '',
  contentFi: '',
  contentSv: '',
  shortDescriptionFi: '',
  shortDescriptionSv: '',
  aineKoodiArvo: ''
}
