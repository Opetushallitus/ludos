import { Layout } from '../layout/Layout'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { Route, Routes } from 'react-router-dom'
import { frontpageKey, createKey, sukoKey, puhviKey, ldKey } from './routes'
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
        <Route
          path={`${sukoKey}/:assignmentType${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi koetehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route
          path={`${puhviKey}${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi puheviestintä tehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route
          path={`${ldKey}${createKey}`}
          element={
            <AssignmentForm
              header="Luo uusi lukiodiplomi tehtävä"
              description="Lisää uusi tehtävä molemmilla kielillä. Julkaise tehtävä tai tallenna se luonnoksena."
            />
          }
        />
        <Route path={frontpageKey} element={<Frontpage />} />
        <Route path={sukoKey}>
          <Route index path={':assignmentType?'} element={<Assignments rootPath={'suko'} />} />
          <Route path={':assignmentType/:id'} element={<Assignment />} />
        </Route>
        <Route path={puhviKey}>
          <Route index path={':assignmentType?'} element={<Assignments rootPath={'puhvi'} />} />
          <Route path={':id'} element={<Assignment />} />
        </Route>
        <Route path={ldKey}>
          <Route index path={':assignmentType?'} element={<Assignments rootPath={'ld'} />} />
          <Route path={':assignmentType/:id'} element={<Assignment />} />
        </Route>
        <Route path={ldKey}>
          <Route
            index
            element={
              <div>
                <h2>palautteet</h2>
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
