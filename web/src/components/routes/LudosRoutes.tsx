import { Layout } from '../layout/Layout'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { Route, Routes } from 'react-router-dom'
import { frontpageKey, assignmentsKey, createKey, instructionsKey, feedbackKey, certificatesKey } from './routes'
import { Frontpage } from '../Frontpage'
import { Assignments } from '../assignment/Assignments'
import { AssignmentForm } from '../assignment/AssignmentForm'
import { Assignment } from '../assignment/Assignment'

export const LudosRoutes = () => (
  <Layout header={<Header />} footer={<Footer />}>
    <Routes>
      <Route path={frontpageKey} element={<Frontpage />} />
      <Route path={assignmentsKey}>
        <Route index element={<Assignments />} />
        <Route path={':id'} element={<Assignment />} />
      </Route>
      <Route
        path={`${assignmentsKey}${createKey}`}
        element={
          <AssignmentForm
            header="Luo uusi koetehtävä"
            description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
          />
        }
      />
      <Route
        path={instructionsKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
      <Route
        path={certificatesKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
      <Route
        path={feedbackKey}
        element={
          <div className="px-5 pt-3">
            <h2>ohjeet</h2>
          </div>
        }
      />
    </Routes>
  </Layout>
)
