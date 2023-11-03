import { z } from 'zod'
import { ErrorMessages, Exam, PublishState } from '../../../types'

export const MIN_NAME_LENGTH = 3
export const examEnumZodType = z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED })
export const publishStateEnumZodType = z
  .enum([PublishState.Published, PublishState.Draft, PublishState.Deleted])
  .optional()
