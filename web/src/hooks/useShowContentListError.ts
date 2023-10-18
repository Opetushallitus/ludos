import { useEffect } from 'react'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { ContentType } from '../types'
import { useLudosTranslation } from './useLudosTranslation'

export function useShowContentListError(contentType: ContentType, error: boolean) {
  const { lt } = useLudosTranslation()
  const { setNotification } = useNotification()

  useEffect(() => {
    if (error) {
      setNotification({
        message: lt.contentListErrorMessage[contentType],
        type: NotificationEnum.error
      })
    }
  }, [contentType, error, lt.contentListErrorMessage, setNotification])
}
