import { z } from 'zod'
import { commonSuperRefine, MIN_LENGTH } from '../../assignment/form/assignmentSchema'
import { ErrorMessages } from '../../../../types'

export const instructionSchema = z
  .object({
    exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
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
