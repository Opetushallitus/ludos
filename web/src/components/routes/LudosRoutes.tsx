import { Layout } from '../layout/Layout'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { feedbackKey, frontpageKey, ldKey, newKey, puhviKey, sukoKey, updateKey } from './routes'
import { useTranslation } from 'react-i18next'
import { Exam, Roles } from '../../types'
import { useUserDetails } from '../../hooks/useUserDetails'
import { lazy, ReactElement, ReactNode, Suspense } from 'react'
import { Spinner } from '../Spinner'
import { Frontpage } from '../frontpage/Frontpage'
import Exams from '../exam/Exams'
import { PresentationHeader } from '../header/PresentationHeader'
import { Footer } from '../Footer'

const Content = lazy(() => import('../contentpage/Content'))
const AssignmentForm = lazy(() => import('../exam/assignment/form/AssignmentForm'))
const InstructionForm = lazy(() => import('../exam/instruction/form/InstructionForm'))
const CertificateForm = lazy(() => import('../exam/certificate/form/CertificateForm'))

const SpinnerSuspense = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Spinner className="mt-32 text-center" />}>{children}</Suspense>
)

export const LudosRoutes = () => {
  const { role } = useUserDetails()

  const isAuthorized = role === Roles.YLLAPITAJA || role === Roles.LAATIJA || role === Roles.OPETTAJA

  return (
    <>
      {isAuthorized ? (
        <AuthorizedRoutes />
      ) : (
        <>
          {role === Roles.UNAUTHORIZED ? (
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

const ProtectedRoute = (): ReactElement => {
  const { isYllapitaja } = useUserDetails()

  if (!isYllapitaja) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

function examPathPrefix(exam: Exam): string {
  switch (exam) {
    case Exam.Suko:
      return `/${sukoKey}`
    case Exam.Ld:
      return `/${ldKey}`
    case Exam.Puhvi:
      return `/${puhviKey}`
  }
}

function examRoutes(exam: Exam) {
  return (
    <Route path={examPathPrefix(exam)}>
      <Route element={<ProtectedRoute />}>
        <Route
          path={`assignments/${newKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <AssignmentForm action={newKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`assignments/${updateKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <AssignmentForm action={updateKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`instructions/${newKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <InstructionForm action={newKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`instructions/${updateKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <InstructionForm action={updateKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`certificates/${newKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <CertificateForm action={newKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`certificates/${updateKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <CertificateForm action={updateKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
      </Route>
      <Route
        index
        path={':contentType?'}
        element={
          <Layout>
            <Exams exam={exam} />
          </Layout>
        }
      />
      <Route
        path={':contentType/:id'}
        element={
          <Layout>
            <SpinnerSuspense>
              <Content exam={exam} isPresentation={false} />
            </SpinnerSuspense>
          </Layout>
        }
      />
      <Route
        path=":contentType/:id/presentation"
        element={
          <Layout header={<PresentationHeader />} footer={<Footer isPresentation={true} />}>
            <SpinnerSuspense>
              <Content exam={exam} isPresentation={true} />
            </SpinnerSuspense>
          </Layout>
        }
      />
    </Route>
  )
}

function AuthorizedRoutes() {
  const { t } = useTranslation()

  return (
    <Routes>
      <Route
        path={`/${frontpageKey}`}
        element={
          <Layout>
            <Frontpage />
          </Layout>
        }
      />
      <Route path="/" element={<Navigate to={`/${frontpageKey}`} />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path={`/${feedbackKey}`}
          element={
            <Layout>
              <div>
                <h2 data-testid={`page-heading-${feedbackKey.replace('/', '')}`}>{t('title.palautteet')}</h2>
              </div>
            </Layout>
          }
        />
      </Route>
      {examRoutes(Exam.Suko)}
      {examRoutes(Exam.Ld)}
      {examRoutes(Exam.Puhvi)}
      <Route path={'/unauthorized'} element={<UnauthorizedPage />} />
      <Route
        path="*"
        element={
          <Layout>
            <div className="p-10">
              <h2 className="text-green-primary">404</h2>
              <p>{t('error.sivua-ei-loydy')}</p>
            </div>
          </Layout>
        }
      />
    </Routes>
  )
}

function UnauthorizedPage() {
  return (
    <div className="p-10">
      <h1 className="py-3 text-green-primary" data-testid="unauthorizedPage">
        401
      </h1>
      <p>Sinulta puuttuu tarvittavat pääsyoikeudet Ludos-palveluun.</p>
      <p>Du saknar nödvändiga åtkomsträttigheter till Ludos-tjänsten.</p>
    </div>
  )
}

function UnauthorizedRoutes() {
  return (
    <Routes>
      <Route path="*" element={<UnauthorizedPage />} />
    </Routes>
  )
}
