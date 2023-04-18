import { Layout } from '../layout/Layout'
import { Header } from '../header/Header'
import { Footer } from '../Footer'
import { Navigate, Route, Routes } from 'react-router-dom'
import { contentKey, createKey, feedbackKey, frontpageKey, ldKey, puhviKey, sukoKey } from './routes'
import { Frontpage } from '../frontpage/Frontpage'
import { Assignments } from '../assignment/Assignments'
import { AssignmentForm } from '../assignment/AssignmentForm'
import { Assignment } from '../assignment/Assignment'
import { useMediaQuery } from '../useMediaQuery'
import { HeaderMobile } from '../header/HeaderMobile'
import { IS_MOBILE_QUERY } from '../../constants'
import { useTranslation } from 'react-i18next'

export const LudosRoutes = () => {
  const { t } = useTranslation()
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  return (
    <Layout header={isMobile ? <HeaderMobile /> : <Header />} footer={<Footer t={t} />}>
      <Routes>
        <Route path={`/${frontpageKey}`} element={<Frontpage />} />
        <Route path="/" element={<Navigate to={`/${frontpageKey}`} />} />
        <Route
          path={`/${feedbackKey}`}
          element={
            <div>
              <h2 data-testid={`page-heading-${feedbackKey.replace('/', '')}`}>{t('title.palautteet')}</h2>
            </div>
          }
        />
        <Route
          path={`/${contentKey}/${sukoKey}/:assignmentType/${createKey}`}
          element={<AssignmentForm header={t('form.suko')} />}
        />
        <Route path={`/${contentKey}/${puhviKey}/${createKey}`} element={<AssignmentForm header={t('form.puhvi')} />} />
        <Route path={`/${contentKey}/${ldKey}/${createKey}`} element={<AssignmentForm header={t('form.ld')} />} />
        <Route path={`/${contentKey}/:examType`}>
          <Route index path={':assignmentType?'} element={<Assignments />} />
          <Route path={':assignmentType/:id'} element={<Assignment />} />
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
