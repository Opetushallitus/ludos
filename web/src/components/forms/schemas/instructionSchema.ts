import { z } from 'zod'
import { commonSuperRefine } from './assignmentSchema'
import { ErrorMessages, Exam, PublishState } from '../../../types'
import { MIN_NAME_LENGTH } from './schemaCommon'

export const instructionSchema = z
  .object({
    exam: z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED }),
    publishState: z.enum([PublishState.Published, PublishState.Draft, PublishState.Deleted]).optional(),
    nameFi: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    nameSv: z.string().min(MIN_NAME_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    contentFi: z.string().default(''),
    contentSv: z.string().default(''),
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
