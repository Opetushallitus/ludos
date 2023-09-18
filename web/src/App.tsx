import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/routes/LudosRoutes'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { LudosContextProvider } from './components/LudosContextProvider'
import { NotificationProvider } from './NotificationContext'
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
