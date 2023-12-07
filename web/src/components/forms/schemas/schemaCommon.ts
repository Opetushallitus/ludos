import { z } from 'zod'
import { ErrorMessages, Exam, PublishState } from '../../../types'

export const MIN_NAME_LENGTH = 3
export const examEnumZodType = z.enum([Exam.SUKO, Exam.LD, Exam.PUHVI], { required_error: ErrorMessages.REQUIRED })
export const publishStateEnumZodType = z
  .enum([PublishState.Published, PublishState.Draft, PublishState.Deleted])
  .optional()

export const validateImgTags = (htmlString: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const images = doc.querySelectorAll('img')

  return Array.from(images).every((img) => img.getAttribute('alt') && img.getAttribute('alt')?.trim() !== '')
}

export const validateImgTagsInArray = (htmlStringArray: string[]) =>
  htmlStringArray.every((htmlString) => validateImgTags(htmlString))
