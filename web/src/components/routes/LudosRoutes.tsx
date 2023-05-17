import { Layout } from '../layout/Layout'
import { Header } from '../header/Header'
import { Footer } from '../Footer'
import { Navigate, Route, Routes } from 'react-router-dom'
import { newKey, feedbackKey, frontpageKey, ldKey, puhviKey, sukoKey, updateKey } from './routes'
import { Frontpage } from '../frontpage/Frontpage'
import { Exams } from '../exam/Exams'
import { AssignmentForm } from '../exam/assignment/form/AssignmentForm'
import { Content } from '../contentpage/Content'
import { HeaderMobile } from '../header/HeaderMobile'
import { IS_MOBILE_QUERY } from '../../constants'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Exam } from '../../types'
import { CertificateForm } from '../exam/certificate/form/CertificateForm'
import { InstructionForm } from '../exam/instruction/form/InstructionForm'
import { useFetch } from '../../hooks/useFetch'

export const LudosRoutes = () => {
  const { t } = useTranslation()
  const { data } = useFetch<{ name: string }>('auth')

  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  return (
    <Layout
      header={isMobile ? <HeaderMobile username={data?.name} /> : <Header username={data?.name} />}
      footer={<Footer t={t} />}>
      <Routes>
        <Route path={`/${frontpageKey}`} element={<Frontpage username={data?.name} />} />
        <Route path="/" element={<Navigate to={`/${frontpageKey}`} />} />
        <Route
          path={`/${feedbackKey}`}
          element={
            <div>
              <h2 data-testid={`page-heading-${feedbackKey.replace('/', '')}`}>{t('title.palautteet')}</h2>
            </div>
          }
        />
        <Route path={`/${sukoKey}`}>
          <Route path={`assignments/${newKey}`} element={<AssignmentForm action={newKey} />} />
          <Route path={`assignments/${updateKey}`} element={<AssignmentForm action={updateKey} />} />
          <Route path={`instructions/${newKey}`} element={<InstructionForm action={newKey} />} />
          <Route path={`instructions/${updateKey}`} element={<InstructionForm action={updateKey} />} />
          <Route path={`certificates/${newKey}`} element={<CertificateForm action={newKey} />} />
          <Route path={`certificates/${updateKey}`} element={<CertificateForm action={updateKey} />} />
          <Route index path={':contentType?'} element={<Exams exam={Exam.Suko} />} />
          <Route path={':contentType/:id'} element={<Content exam={Exam.Suko} />} />
        </Route>
        <Route path={`/${puhviKey}`}>
          <Route path={`assignments/${newKey}`} element={<AssignmentForm action={newKey} />} />
          <Route path={`assignments/${updateKey}`} element={<AssignmentForm action={updateKey} />} />
          <Route path={`instructions/${newKey}`} element={<InstructionForm action={newKey} />} />
          <Route path={`instructions/${updateKey}`} element={<InstructionForm action={updateKey} />} />
          <Route path={`certificates/${newKey}`} element={<CertificateForm action={newKey} />} />
          <Route path={`certificates/${updateKey}`} element={<CertificateForm action={updateKey} />} />
          <Route index path={':contentType?'} element={<Exams exam={Exam.Puhvi} />} />
          <Route path={':contentType/:id'} element={<Content exam={Exam.Puhvi} />} />
        </Route>
        <Route path={`/${ldKey}`}>
          <Route path={`assignments/${newKey}`} element={<AssignmentForm action={newKey} />} />
          <Route path={`assignments/${updateKey}`} element={<AssignmentForm action={updateKey} />} />
          <Route path={`instructions/${newKey}`} element={<InstructionForm action={newKey} />} />
          <Route path={`instructions/${updateKey}`} element={<InstructionForm action={updateKey} />} />
          <Route path={`certificates/${newKey}`} element={<CertificateForm action={newKey} />} />
          <Route path={`certificates/${updateKey}`} element={<CertificateForm action={updateKey} />} />
          <Route index path={':contentType?'} element={<Exams exam={Exam.Ld} />} />
          <Route path={':contentType/:id'} element={<Content exam={Exam.Ld} />} />
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
