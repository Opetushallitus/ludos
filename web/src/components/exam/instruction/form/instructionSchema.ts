import { z } from 'zod'

export const instructionSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  nameFi: z.string(),
  nameSv: z.string().default(''),
  contentFi: z.string().default(''),
  contentSv: z.string().default(''),
  shortDescriptionFi: z.string().default(''),
  shortDescriptionSv: z.string().default('')
})

export type InstructionFormType = z.infer<typeof instructionSchema>
