import { z } from 'zod'
import { ErrorMessages, Exam, PublishState } from '../../../types'

export const MIN_NAME_LENGTH = 3
export const examEnumZodType = z.enum(Exam).readonly()
export const publishStateEnumZodType = z.enum(PublishState).readonly()

export const validateImgTags = (htmlString: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const images = doc.querySelectorAll('img')

  return Array.from(images).every((img) => img.getAttribute('alt') && img.getAttribute('alt')?.trim() !== '')
}

export const validateImgTagsInArray = (htmlStringArray: string[] | undefined) =>
  htmlStringArray?.every((htmlString) => validateImgTags(htmlString))

export const inputNotEmptyValidation = z
  .string()
  .refine((val) => val.trim().length > 0, { message: ErrorMessages.REQUIRED })

export const nameValidation = z
  .string({ error: (issue) => (issue.input === undefined ? ErrorMessages.REQUIRED : undefined) })
  .min(MIN_NAME_LENGTH, ErrorMessages.SHORT)

export const nameOrEmptyStringValidation = z
  .string()
  .refine((val) => val.trim().length >= MIN_NAME_LENGTH, { message: ErrorMessages.REQUIRED })
  .optional()
  .or(z.literal(''))
  .default('')
