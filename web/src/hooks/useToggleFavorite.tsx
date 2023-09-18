import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction, useContext } from 'react'
import { LudosContext } from '../LudosContext'
import { NotificationEnum, useNotification } from '../NotificationContext'
import { setAssignmentFavorite } from '../request'

interface UseToggleFavoriteProps {
  exam: any
  assignmentId: number
  isFavorite: boolean
  setIsFavorite: Dispatch<SetStateAction<boolean>>
  refreshData?: () => void
}

export function useToggleFavorite({
  exam,
  assignmentId,
  isFavorite,
  setIsFavorite,
  refreshData
}: UseToggleFavoriteProps) {
  const { t } = useTranslation()
  const { setUserFavoriteAssignmentCount } = useContext(LudosContext)
  const { setNotification } = useNotification()

  const toggleFavorite = async () => {
    try {
      const totalFavoriteCount = await setAssignmentFavorite(exam, assignmentId, !isFavorite)
      setUserFavoriteAssignmentCount(totalFavoriteCount)
      setIsFavorite(!isFavorite)
      setNotification({
        type: NotificationEnum.success,
        message: isFavorite
          ? t('assignment.notification.suosikki-poistettu')
          : t('assignment.notification.suosikki-lisatty')
      })
    } catch (e) {
      console.error(e)
    } finally {
      refreshData?.()
    }
  }

  return { toggleFavorite }
}
