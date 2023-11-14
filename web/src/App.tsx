import { RouterProvider } from 'react-router-dom'
import { ludosRouter } from './components/LudosRoutes'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { LudosContextProvider } from './contexts/LudosContextProvider'
import { NotificationProvider } from './contexts/NotificationContext'
import { useHideSpringSecurityMatchingRequestParameter } from './hooks/useHideSpringSecurityMatchingRequestParameter'

const App = () => {
  useDocumentLanguage()
  useHideSpringSecurityMatchingRequestParameter()

  return (
    <LudosContextProvider>
      <NotificationProvider>
        <RouterProvider router={ludosRouter} />
      </NotificationProvider>
    </LudosContextProvider>
  )
}

export default App
