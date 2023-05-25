const MIN_LENGTH = 3
import { z } from 'zod'

export const instructionSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  nameFi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  nameSv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  contentFi: z.string().nullable(),
  contentSv: z.string().nullable()
})

export type InstructionFormType = z.infer<typeof instructionSchema>
