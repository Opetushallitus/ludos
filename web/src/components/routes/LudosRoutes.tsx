import { Layout } from '../layout/Layout'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { Navigate, Route, Routes } from 'react-router-dom'
import { createKey, examKey, feedbackKey, frontpageKey, ldKey, puhviKey, sukoKey } from './routes'
import { Frontpage } from '../frontpage/Frontpage'
import { Assignments } from '../assignment/Assignments'
import { AssignmentForm } from '../assignment/AssignmentForm'
import { Assignment } from '../assignment/Assignment'
import { useMediaQuery } from '../useMediaQuery'
import { HeaderMobile } from '../HeaderMobile'
import { IS_MOBILE_QUERY } from '../../constants'

export const LudosRoutes = () => {
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  return (
    <Layout header={isMobile ? <HeaderMobile /> : <Header />} footer={<Footer />}>
      <Routes>
        <Route path={frontpageKey} element={<Frontpage />} />
        <Route path="/" element={<Navigate to={frontpageKey} />} />
        <Route
          path={feedbackKey}
          element={
            <div>
              <h2 data-testid={`page-heading-${feedbackKey.replace('/', '')}`}>Palautteet</h2>
            </div>
          }
        />
        <Route
          path={`${examKey}${sukoKey}/:assignmentType${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi koetehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route
          path={`${examKey}${puhviKey}${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi puheviestintä tehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route
          path={`${examKey}${ldKey}${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi lukiodiplomi tehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route path={`${examKey}/:examType`}>
          <Route index path={':assignmentType?'} element={<Assignments />} />
          <Route path={':assignmentType/:id'} element={<Assignment />} />
          <Route
            path="*"
            element={
              <div className="p-10">
                <h2 className="text-green-primary">404</h2>
                <p>Valitettavasti sivua ei löytynyt.</p>
              </div>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <div className="p-10">
              <h2 className="text-green-primary">404</h2>
              <p>Valitettavasti sivua ei löytynyt.</p>
            </div>
          }
        />
      </Routes>
    </Layout>
  )
}
