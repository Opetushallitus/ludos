import { z } from 'zod'
import { AddToFavoriteOptions, ErrorMessages, Exam } from '../../../types'
import { examEnumZodType } from '../../forms/schemas/schemaCommon'

export const favoriteToggleModalFormSchema = z
  .object({
    assignmentId: z.number(),
    exam: examEnumZodType,
    addOptions: z.enum([AddToFavoriteOptions.FAVORITES, AddToFavoriteOptions.FOLDER, AddToFavoriteOptions.NEW_FOLDER]),
    favoriteFolderIds: z.array(z.number()).optional(),
    newFolderName: z.string().default('')
  })
  .refine(
    (data) => {
      if (data.addOptions === AddToFavoriteOptions.NEW_FOLDER) {
        return data.newFolderName.length > 0
      }
      return true
    },
    {
      message: ErrorMessages.REQUIRED,
      path: ['newFolderName']
    }
  )

export type FavoriteToggleModalFormType = z.infer<typeof favoriteToggleModalFormSchema>

export const favoriteToggleModalFormDefaultValues = (
  exam: Exam,
  assignmentId: number
): FavoriteToggleModalFormType => ({
  exam,
  assignmentId,
  addOptions: AddToFavoriteOptions.FAVORITES,
  favoriteFolderIds: [],
  newFolderName: ''
})
