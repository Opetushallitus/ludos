import { Layout } from '../layout/Layout'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { feedbackKey, frontpageKey, ldKey, newKey, puhviKey, sukoKey, updateKey } from './routes'
import { useTranslation } from 'react-i18next'
import { Exam, Roles } from '../../types'
import { Header } from '../header/Header'
import { useUserDetails } from '../../hooks/useUserDetails'
import { lazy, ReactElement, ReactNode, Suspense } from 'react'
import { Spinner } from '../Spinner'
import { Footer } from '../Footer'
import { Frontpage } from '../frontpage/Frontpage'
import Exams from '../exam/Exams'

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

function AuthorizedRoutes() {
  const { t } = useTranslation()

  return (
    <Layout header={<Header />} footer={<Footer t={t} />}>
      <Routes>
        <Route path={`/${frontpageKey}`} element={<Frontpage />} />
        <Route path="/" element={<Navigate to={`/${frontpageKey}`} />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path={`/${feedbackKey}`}
            element={
              <div>
                <h2 data-testid={`page-heading-${feedbackKey.replace('/', '')}`}>{t('title.palautteet')}</h2>
              </div>
            }
          />
        </Route>
        <Route path={`/${sukoKey}`}>
          <Route element={<ProtectedRoute />}>
            <Route
              path={`assignments/${newKey}`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`assignments/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${newKey}`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${newKey}`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
          </Route>
          <Route index path={':contentType?'} element={<Exams exam={Exam.Suko} />} />
          <Route
            path={':contentType/:id'}
            element={
              <SpinnerSuspense>
                <Content exam={Exam.Suko} />
              </SpinnerSuspense>
            }
          />
        </Route>
        <Route path={`/${puhviKey}`}>
          <Route element={<ProtectedRoute />}>
            <Route
              path={`assignments/${newKey}`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`assignments/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${newKey}`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${newKey}`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
          </Route>
          <Route index path={':contentType?'} element={<Exams exam={Exam.Puhvi} />} />
          <Route
            path={':contentType/:id'}
            element={
              <SpinnerSuspense>
                <Content exam={Exam.Puhvi} />
              </SpinnerSuspense>
            }
          />
        </Route>
        <Route path={`/${ldKey}`}>
          <Route element={<ProtectedRoute />}>
            <Route
              path={`assignments/${newKey}`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`assignments/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <AssignmentForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${newKey}`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`instructions/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <InstructionForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${newKey}`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={newKey} />
                </SpinnerSuspense>
              }
            />
            <Route
              path={`certificates/${updateKey}/:id`}
              element={
                <SpinnerSuspense>
                  <CertificateForm action={updateKey} />
                </SpinnerSuspense>
              }
            />
          </Route>
          <Route index path={':contentType?'} element={<Exams exam={Exam.Ld} />} />
          <Route
            path={':contentType/:id'}
            element={
              <SpinnerSuspense>
                <Content exam={Exam.Ld} />
              </SpinnerSuspense>
            }
          />
        </Route>
        <Route path={'/unauthorized'} element={<UnauthorizedPage />} />
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
