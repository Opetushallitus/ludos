import { useEffect, useState } from 'react'

function Frontpage() {
  const [data, setData] = useState('')

  useEffect(() => {
    ;(async () => {
      const response = await fetch('/api/', { method: 'GET' })
      const json = await response.json()
      setData(json.message)
    })()
  }, [])

  return (
    <div className="px-5 pt-3">
      <h2 className="text-gray-primary text-2xl font-semibold" data-testid="heading">
        Hei Yrjö Ylivoima, tervetuloa Koepankin ylläpitoon!
        <br />
        <br />
        {data}
      </h2>
    </div>
  )
}

export default Frontpage
