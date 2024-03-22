import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useFetch'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
