const MIN_LENGTH = 3
import { z } from 'zod'

export const sukoSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  examType: z.enum(['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES'], { required_error: 'Required' }),
  assignmentType: z.string({ required_error: 'Required' }),
  //topic: z.array(z.string()).min(1, { message: 'Valitse ainakin yksi' }),
  name_fi: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  name_sv: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  content_fi: z.string().nullable(),
  content_sv: z.string().nullable()
})

export type SukoAssignmentForm = z.infer<typeof sukoSchema>
