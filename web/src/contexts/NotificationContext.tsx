import { createContext, Dispatch, ReactElement, ReactNode, SetStateAction, useContext, useState } from 'react'

export const NotificationEnum = {
  success: 'success',
  error: 'error'
} as const

export type NotificationType = (typeof NotificationEnum)[keyof typeof NotificationEnum]

export type ContextNotification = {
  message: string
  type: NotificationType
  linkComponent?: ReactElement
}

type NotificationContextProps = {
  notification: ContextNotification | null
  setNotification: Dispatch<SetStateAction<ContextNotification | null>>
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<ContextNotification | null>(null)
  return (
    <NotificationContext.Provider value={{ notification, setNotification }}>{children}</NotificationContext.Provider>
  )
}
