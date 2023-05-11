import { ReactNode, useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/routes/LudosRoutes'
import { defaultEmptyKoodisto, KoodistoContext, KoodistoMap } from './KoodistoContext'
import { useTranslation } from 'react-i18next'

const App = () => {
  const KoodistotContextProvider = ({ children }: { children: ReactNode }) => {
    const { i18n } = useTranslation()
    const [koodistos, setKoodistos] = useState<KoodistoMap>(defaultEmptyKoodisto)

    useEffect(() => {
      ;(async () => {
        try {
          const response = await fetch(`/api/koodisto/${i18n.language.toUpperCase()}`, { method: 'GET' })

          if (!response.ok) {
            console.error('could not fetch koodistos')
            return
          }

          const json = await response.json()

          setKoodistos(json)
        } catch (e) {
          console.error('could not fetch koodistos', e)
        }
      })()
    }, [i18n.language])

    return (
      <KoodistoContext.Provider value={{ koodistos: koodistos, setKoodistos }}>{children}</KoodistoContext.Provider>
    )
  }

  return (
    <BrowserRouter>
      <KoodistotContextProvider>
        <LudosRoutes />
      </KoodistotContextProvider>
    </BrowserRouter>
  )
}

export default App
