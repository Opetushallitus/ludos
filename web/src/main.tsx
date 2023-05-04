import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { LudosRoutes } from './components/routes/LudosRoutes'
import './i18n'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <LudosRoutes />
    </BrowserRouter>
  </React.StrictMode>
)
