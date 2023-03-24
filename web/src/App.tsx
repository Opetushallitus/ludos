import { useEffect, useState } from 'react'
import { Layout } from './components/layout/Layout'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

function App() {
  const [data, setData] = useState('')

  useEffect(() => {
    ;(async () => {
      const response = await fetch('http://localhost:8080/api/', { method: 'GET' })
      const json = await response.json()
      setData(json.message)
    })()
  }, [])

  return (
    <Layout header={<Header />} footer={<Footer />}>
      <div className="px-5 pt-3">
        <h2 className="text-2xl underline text-omaVari-100" data-testid="heading">
          Server says: {data}
        </h2>
      </div>
    </Layout>
  )
}

export default App
