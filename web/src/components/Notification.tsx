import { useCallback, useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'
import { useFeedbackUrl } from '../hooks/useFeedbackUrl'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { Button } from './Button'
import { ExternalLink } from './ExternalLink'
import { Icon } from './Icon'

const NOTIFICATION_TIMEOUT_MS = 5000

export const Notification = () => {
  const { t } = useLudosTranslation()
  const { notification, setNotification } = useNotification()
  const feedbackUrl = useFeedbackUrl(notification?.message)
  const hideNotification = useCallback(() => setNotification(null), [setNotification])

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (notification && notification.type === NotificationEnum.success) {
      timerRef.current = setTimeout(() => {
        hideNotification()
        timerRef.current = null
      }, NOTIFICATION_TIMEOUT_MS)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [notification, hideNotification])

  return (
    <>
      {notification && (
        <div
          className={twMerge(
            'flex fixed top-[7.4rem] right-[10vw] p-5 gap-1 rounded text-white w-auto z-50 text-sm flex-nowrap',
            notification.type === NotificationEnum.success ? 'bg-green-primary' : 'bg-red-primary'
          )}
          data-testid={`notification-${notification.type}`}
        >
          {notification.type === NotificationEnum.success ? (
            <Icon name="onnistunut" color="text-white" />
          ) : (
            <Icon name="virhe" color="text-white" />
          )}
          {notification.message}
          {notification.type === NotificationEnum.error && (
            <>
              {notification.linkComponent || (
                <ExternalLink className="underline" textColor="text-white" url={feedbackUrl}>
                  {t('notification.error.link.laheta-palautetta-virheesta')}
                </ExternalLink>
              )}
            </>
          )}
          {notification.type === NotificationEnum.error && (
            <Button variant="buttonGhost" className="absolute top-0 right-0 pr-1" onClick={hideNotification}>
              <Icon name="sulje" size="lg" color="text-white" />
            </Button>
          )}
        </div>
      )}
    </>
  )
}
