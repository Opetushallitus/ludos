import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { setAssignmentFavorite } from '../request'
import { FavoriteToggleModalFormType } from '../components/modal/favoriteModal/favoriteToggleModalFormSchema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FAVORITE_COUNT_QUERY_KEY } from '../contexts/LudosContextProvider'
import { useLudosTranslation } from './useLudosTranslation'
import { AddToFavoriteOptions, ContentBaseOut, FavoriteAction } from '../types'

export function useSetFavoriteFolders(refresh: () => void) {
  const { lt } = useLudosTranslation()
  const { setNotification } = useNotification()
  const queryClient = useQueryClient()

  const { mutateAsync: setFavoriteFolders } = useMutation({
    mutationFn: async ({ data }: { data: FavoriteToggleModalFormType; favoriteAction: FavoriteAction }) => {
      return setAssignmentFavorite(data)
    },
    onSuccess: (totalFavoriteCount, { favoriteAction }) => {
      queryClient.setQueryData(FAVORITE_COUNT_QUERY_KEY, totalFavoriteCount)
      setNotification({
        type: NotificationEnum.success,
        message: lt.favoriteActionNotificationTexts[favoriteAction]
      })
      refresh()
    },
    onError: console.error
  })

  const unFavorite = async (assignment: ContentBaseOut) => {
    await setFavoriteFolders({
      data: {
        assignmentId: assignment.id,
        exam: assignment.exam,
        addOptions: AddToFavoriteOptions.FOLDER,
        newFolderName: '',
        favoriteFolderIds: []
      },
      favoriteAction: FavoriteAction.REMOVE
    })
  }

  return { setFavoriteFolders, unFavorite }
}
