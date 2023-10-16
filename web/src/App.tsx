import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/LudosRoutes'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { LudosContextProvider } from './contexts/LudosContextProvider'
import { NotificationProvider } from './contexts/NotificationContext'
import { useHideSpringSecurityMatchingRequestParameter } from './hooks/useHideSpringSecurityMatchingRequestParameter'

const App = () => {
  useDocumentLanguage()
  useHideSpringSecurityMatchingRequestParameter()

  return (
    <BrowserRouter>
      <LudosContextProvider>
        <NotificationProvider>
          <LudosRoutes />
        </NotificationProvider>
      </LudosContextProvider>
    </BrowserRouter>
  )
}

export default App
