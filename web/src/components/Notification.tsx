import { useCallback, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { Icon } from './Icon'
import { Button } from './Button'
import { NotificationEnum, useNotification } from '../contexts/NotificationContext'

const NOTIFICATION_TIMEOUT_MS = 5000

export const Notification = () => {
  const { notification, setNotification } = useNotification()
  const hideNotification = useCallback(() => setNotification(null), [setNotification])

  useEffect(() => {
    if (notification && notification.type === NotificationEnum.success) {
      const timer = setTimeout(() => hideNotification(), NOTIFICATION_TIMEOUT_MS)
      return () => clearTimeout(timer)
    }
  }, [notification, hideNotification])

  return (
    <>
      {notification && (
        <div
          className={twMerge(
            'flex fixed top-[7.4rem] right-[10vw] p-3 gap-1 rounded text-white w-auto z-50 text-sm',
            notification.type === NotificationEnum.success ? 'bg-green-primary' : 'bg-red-primary w-72'
          )}
          data-testid={`notification-${notification.type}`}>
          {notification.type === NotificationEnum.success ? (
            <Icon name="onnistunut" color="text-white" />
          ) : (
            <Icon name="virheellinen" color="text-white" isActive />
          )}
          {notification.message}
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
