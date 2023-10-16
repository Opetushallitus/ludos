import { z } from 'zod'
import { commonSuperRefine, MIN_LENGTH } from './assignmentSchema'
import { ErrorMessages, Exam, PublishState } from '../../../types'

export const instructionSchema = z
  .object({
    exam: z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED }),
    publishState: z.enum([PublishState.Published, PublishState.Draft, PublishState.Archived]).optional(),
    nameFi: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    nameSv: z.string().min(MIN_LENGTH, ErrorMessages.SHORT).optional().or(z.literal('')).default(''),
    contentFi: z.string().default(''),
    contentSv: z.string().default(''),
    shortDescriptionFi: z.string(),
    shortDescriptionSv: z.string(),
    nameRequired: z.custom()
  })
  .superRefine(commonSuperRefine)

export type InstructionFormType = z.infer<typeof instructionSchema>
