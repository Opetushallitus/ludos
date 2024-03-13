import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { setAssignmentFavorite } from '../request'
import { FavoriteToggleModalFormType } from '../components/modal/favoriteModal/favoriteToggleModalFormSchema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FAVORITE_COUNT_QUERY_KEY } from '../contexts/LudosContextProvider'
import { useLudosTranslation } from './useLudosTranslation'

export function useSetFavoriteFolders(refresh: () => void) {
  const { t } = useLudosTranslation()
  const { setNotification } = useNotification()
  const queryClient = useQueryClient()

  const { mutateAsync: setFavoriteFolders } = useMutation({
    mutationFn: (data: FavoriteToggleModalFormType) => setAssignmentFavorite(data),
    onSuccess: (totalFavoriteCount) => {
      queryClient.setQueryData(FAVORITE_COUNT_QUERY_KEY, totalFavoriteCount)
      setNotification({
        type: NotificationEnum.success,
        message: t('assignment.notification.suosikki-muokattu')
      })
      refresh()
    },
    onError: (error) => console.error(error)
  })

  return { setFavoriteFolder: setFavoriteFolders }
}
