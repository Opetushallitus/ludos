import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/routes/LudosRoutes'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { KoodistotContextProvider } from './components/KoodistoContextProvider'

const App = () => {
  useDocumentLanguage()

  return (
    <BrowserRouter>
      <KoodistotContextProvider>
        <LudosRoutes />
      </KoodistotContextProvider>
    </BrowserRouter>
  )
}

export default App
