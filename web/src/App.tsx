import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/routes/LudosRoutes'
import { useDocumentLanguage } from './hooks/useDocumentLanguage'
import { LudosContextProvider } from './components/LudosContextProvider'

const App = () => {
  useDocumentLanguage()

  return (
    <BrowserRouter>
      <LudosContextProvider>
        <LudosRoutes />
      </LudosContextProvider>
    </BrowserRouter>
  )
}

export default App
