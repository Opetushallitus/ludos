const MIN_LENGTH = 3
import { z } from 'zod'

export const instructionSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  nameFi: z.string(),
  nameSv: z.string(),
  contentFi: z.string(),
  contentSv: z.string()
})

export type InstructionFormType = z.infer<typeof instructionSchema>
