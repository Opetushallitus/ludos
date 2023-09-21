import { Layout } from '../layout/Layout'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { palautteetKey, ldKey, uusiKey, puhviKey, sukoKey, muokkausKey, luvatonKey } from './routes'
import { useTranslation } from 'react-i18next'
import { ContentType, Exam, Roles } from '../../types'
import { useUserDetails } from '../../hooks/useUserDetails'
import { lazy, ReactElement, ReactNode, Suspense } from 'react'
import { Spinner } from '../Spinner'
import { Frontpage } from '../frontpage/Frontpage'
import ContentListPage from '../exam/ContentListPage'
import { PresentationHeader } from '../header/PresentationHeader'
import { Footer } from '../Footer'
import { AssignmentFavorite } from '../exam/assignment/assignmentFavorite/AssignmentFavorite'

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
    return <Navigate to={`/${luvatonKey}`} replace />
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
          path={`${ContentType.koetehtavat}/${uusiKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <AssignmentForm action={uusiKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`${ContentType.koetehtavat}/${muokkausKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <AssignmentForm action={muokkausKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`${ContentType.ohjeet}/${uusiKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <InstructionForm action={uusiKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`${ContentType.ohjeet}/${muokkausKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <InstructionForm action={muokkausKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`${ContentType.todistukset}/${uusiKey}`}
          element={
            <Layout>
              <SpinnerSuspense>
                <CertificateForm action={uusiKey} />
              </SpinnerSuspense>
            </Layout>
          }
        />
        <Route
          path={`${ContentType.todistukset}/${muokkausKey}/:id`}
          element={
            <Layout>
              <SpinnerSuspense>
                <CertificateForm action={muokkausKey} />
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
            <ContentListPage exam={exam} />
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
        path={`/`}
        element={
          <Layout>
            <Frontpage />
          </Layout>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route
          path={`/${palautteetKey}`}
          element={
            <Layout>
              <div>
                <h2 data-testid={`page-heading-${palautteetKey}`}>{t('title.palautteet')}</h2>
              </div>
            </Layout>
          }
        />
      </Route>
      {examRoutes(Exam.Suko)}
      {examRoutes(Exam.Ld)}
      {examRoutes(Exam.Puhvi)}
      <Route
        path="/favorites/:exam?"
        element={
          <Layout>
            <AssignmentFavorite />
          </Layout>
        }
      />
      <Route path={`/${luvatonKey}`} element={<UnauthorizedPage />} />
      <Route path={`/vitelogin`} element={<Navigate replace to="/" />} />
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
