import { Layout } from '../layout/Layout'
import { Footer } from '../Footer'
import { Navigate, Route, Routes } from 'react-router-dom'
import { newKey, feedbackKey, frontpageKey, ldKey, puhviKey, sukoKey, updateKey } from './routes'
import { Frontpage } from '../frontpage/Frontpage'
import { Exams } from '../exam/Exams'
import { AssignmentForm } from '../exam/assignment/form/AssignmentForm'
import { Content } from '../contentpage/Content'
import { useTranslation } from 'react-i18next'
import { Exam } from '../../types'
import { CertificateForm } from '../exam/certificate/form/CertificateForm'
import { InstructionForm } from '../exam/instruction/form/InstructionForm'
import { Header } from '../header/Header'
import { useUserDetails } from '../../hooks/useUserDetails'

export const LudosRoutes = () => {
  const { role } = useUserDetails()

  const isAuthorized = role === 'YLLAPITAJA' || role === 'LAATIJA' || role === 'OPETTAJA'

  return (
    <>
      {isAuthorized ? (
        <AuthorizedRoutes />
      ) : (
        <>
          {role === 'UNAUTHORIZED' ? (
            <UnauthorizedRoutes />
          ) : (
            <Routes>
              <Route path="*" element={<div />} />
            </Routes>
          )}
        </>
      )}
    </>
  )
}

function AuthorizedRoutes() {
  const { t } = useTranslation()

  return (
    <Layout header={<Header />} footer={<Footer t={t} />}>
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
              <p>{t('error.sivua-ei-loydy')}</p>
            </div>
          }
        />
      </Routes>
    </Layout>
  )
}

function UnauthorizedRoutes() {
  const { t } = useTranslation()

  return (
    <Routes>
      <Route
        path="*"
        element={
          <div className="p-10">
            <h2 className="text-green-primary">403</h2>
            <p>Sinulta puuttuu tarvittavat pääsyoikeudet Ludos -palveluun.</p>
            <p>Du saknar nödvändiga åtkomsträttigheter till Ludos-tjänsten.</p>
          </div>
        }
      />
    </Routes>
  )
}
