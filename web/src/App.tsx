import './App.scss'
import { useEffect, useState } from 'react'

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
    <div className="App">
      <h1>Server says: {data}</h1>
    </div>
  )
}

export default App
