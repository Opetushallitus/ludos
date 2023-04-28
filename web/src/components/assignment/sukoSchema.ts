const MIN_LENGTH = 3
import { z } from 'zod'

export const sukoSchema = z.object({
  exam: z.enum(['SUKO', 'PUHVI', 'LD'], { required_error: 'Required' }),
  examType: z.enum(['ASSIGNMENTS', 'INSTRUCTIONS', 'CERTIFICATES'], { required_error: 'Required' }),
  name: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  assignmentType: z.string({ required_error: 'Required' }),
  content: z.string().nullable()
})

export type SukoAssignmentForm = z.infer<typeof sukoSchema>
