import { z } from 'zod'
import { ErrorMessages, PublishState } from '../../../types'
import { commonSuperRefine } from './assignmentSchema'
import { examEnumZodType, nameOrEmptyStringValidation, publishStateEnumZodType, validateImgTags } from './schemaCommon'

export const instructionSchema = z
  .object({
    exam: examEnumZodType,
    publishState: publishStateEnumZodType,
    nameFi: nameOrEmptyStringValidation,
    nameSv: nameOrEmptyStringValidation,
    contentFi: z.string().refine((htmlString) => validateImgTags(htmlString), {
      message: ErrorMessages.REQUIRED_IMG_ALT
    }),
    contentSv: z.string().refine((htmlString) => validateImgTags(htmlString), {
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
  publishState: PublishState.Published,
  nameFi: '',
  nameSv: '',
  contentFi: '',
  contentSv: '',
  shortDescriptionFi: '',
  shortDescriptionSv: '',
  aineKoodiArvo: ''
}
