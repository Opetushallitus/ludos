import { Layout } from '../layout/Layout'
import { Header } from '../header/Header'
import { Footer } from '../Footer'
import { Navigate, Route, Routes } from 'react-router-dom'
import { contentKey, newKey, feedbackKey, frontpageKey, ldKey, puhviKey, sukoKey, updateKey } from './routes'
import { Frontpage } from '../frontpage/Frontpage'
import { Exams } from '../exam/Exams'
import { AssignmentForm } from '../exam/assignment/form/AssignmentForm'
import { Assignment } from '../assignmentpage/Assignment'
import { HeaderMobile } from '../header/HeaderMobile'
import { IS_MOBILE_QUERY } from '../../constants'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../hooks/useMediaQuery'

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
        <Route path={`/${contentKey}/${sukoKey}/:examType/${newKey}`} element={<AssignmentForm action={newKey} />} />
        <Route path={`/${contentKey}/${puhviKey}/:examType/${newKey}`} element={<AssignmentForm action={newKey} />} />
        <Route path={`/${contentKey}/${ldKey}/:examType/${newKey}`} element={<AssignmentForm action={newKey} />} />
        <Route
          path={`/${contentKey}/${sukoKey}/:examType/${updateKey}`}
          element={<AssignmentForm action={updateKey} />}
        />
        <Route
          path={`/${contentKey}/${puhviKey}/:examType/${updateKey}`}
          element={<AssignmentForm action={updateKey} />}
        />
        <Route
          path={`/${contentKey}/${ldKey}/:examType/${updateKey}`}
          element={<AssignmentForm action={updateKey} />}
        />
        <Route path={`/${contentKey}/:exam`}>
          <Route index path={':examType?'} element={<Exams />} />
          <Route path={':examType/:id'} element={<Assignment />} />
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
