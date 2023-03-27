import React from 'react'
import ReactDOM from 'react-dom/client'
import Frontpage from './Frontpage'
import './index.scss'
import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Pages } from './types'

const etusivuKey = '/'
const koetehtavatKey = '/koetehtavat'
const ohjeetKey = '/ohjeet'
const todistuksetKey = '/todistukset'
const palautteetKey = '/palautteet'

const pages: Pages[] = [
  {
    title: 'etusivu',
    key: etusivuKey
  },
  {
    title: 'koetehtävät',
    key: koetehtavatKey
  },
  {
    title: 'ohjeet',
    key: ohjeetKey
  },
  {
    title: 'todistukset',
    key: todistuksetKey
  },
  {
    title: 'palautteet',
    key: palautteetKey
  }
]

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={
        <Layout header={<Header pages={pages} />} footer={<Footer />}>
          <Outlet />
        </Layout>
      }>
      <Route path={etusivuKey} element={<Frontpage />} />
      <Route
        path={koetehtavatKey}
        element={
          <div className="px-5 pt-3">
            <h2>koe</h2>
          </div>
        }
      />
      <Route
        path={ohjeetKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
      <Route
        path={todistuksetKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
      <Route
        path={palautteetKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
    </Route>
  )
)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
