import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { LudosContext } from '../contexts/LudosContext'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { setAssignmentFavorite } from '../request'
import { FavoriteToggleModalFormType } from '../components/modal/favoriteModal/favoriteToggleModalFormSchema'
import { useLudosTranslation } from './useLudosTranslation'

interface UseToggleFavoriteProps {
  refreshData?: () => void
}

export function useSetFavoriteFolders({ refreshData }: UseToggleFavoriteProps) {
  const { t } = useLudosTranslation()
  const { setUserFavoriteAssignmentCount } = useContext(LudosContext)
  const { setNotification } = useNotification()

  const setFavoriteFolders = async (data: FavoriteToggleModalFormType) => {
    try {
      const totalFavoriteCount = await setAssignmentFavorite(data)
      setUserFavoriteAssignmentCount(totalFavoriteCount)
      setNotification({
        type: NotificationEnum.success,
        message: t('assignment.notification.suosikki-muokattu')
      })
    } catch (e) {
      console.error(e)
    } finally {
      refreshData?.()
    }
  }

  return { setFavoriteFolders }
}
