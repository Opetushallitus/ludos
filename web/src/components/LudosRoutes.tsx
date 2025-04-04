import { Layout } from './layout/Layout'
import {
  createBrowserRouter,
  isRouteErrorResponse,
  Navigate,
  Outlet,
  RouteObject,
  useRouteError
} from 'react-router-dom'
import { ContentBaseOut, ContentFormAction, ContentType, ContentTypePluralFi, Exam, Roles } from '../types'
import { useUserDetails } from '../hooks/useUserDetails'
import { lazy, ReactElement, ReactNode, Suspense } from 'react'
import { Spinner } from './Spinner'
import { Frontpage } from './frontpage/Frontpage'
import { Footer } from './Footer'
import { AssignmentFavorite } from './content/assignmentFavorite/AssignmentFavorite'
import { ReauthorizeSuccessful } from './ReauthorizeSuccessful'
import { useLudosTranslation } from '../hooks/useLudosTranslation'

export const etusivuKey = 'etusivu'
export const uusiKey: ContentFormAction = ContentFormAction.uusi
export const muokkausKey: ContentFormAction = ContentFormAction.muokkaus
export const sukoKey = Exam.SUKO.toLowerCase()
export const puhviKey = Exam.PUHVI.toLowerCase()
export const ldKey = Exam.LD.toLowerCase()
export const suosikitKey = 'suosikit'
export const tulostusnakymaKey = 'tulostusnakyma'
export const uudelleenkirjautuminenOnnistuiPath = '/uudelleenkirjautuminen-onnistui'

export const frontpagePath = () => '/'

export const examPath = (exam: Exam) => `/${exam.toLowerCase()}`

export const contentPagePath = (exam: Exam, contentType: ContentType, id: number, version?: number) =>
  `${examPath(exam)}/${ContentTypePluralFi[contentType]}/${id}${version ? `/${version}` : ''}`

export const contentListPath = (exam: Exam, contentType: ContentType, search?: string) =>
  `${examPath(exam)}/${ContentTypePluralFi[contentType]}${search ?? ''}`

export const editingFormPath = ({ exam, contentType, id }: ContentBaseOut) =>
  `${examPath(exam)}/${ContentTypePluralFi[contentType]}/${muokkausKey}/${id}`

export const favoritesPagePath = (exam: Exam = Exam.SUKO) => `/${suosikitKey}/${exam.toLowerCase()}`

export const pageNotFoundPath = '/sivua-ei-loydy'

const Content = lazy(() => import('./content/Content'))
const PrintContent = lazy(() => import('./content/PrintContent'))
const AssignmentForm = lazy(() => import('./forms/assignment/AssignmentFormPage'))
const InstructionForm = lazy(() => import('./forms/InstructionForm'))
const CertificateForm = lazy(() => import('./forms/certificate/CertificateFormPage'))
const ContentListPage = lazy(() => import('./content/list/ContentListPage'))

const SpinnerSuspense = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Spinner className="mt-32 text-center" />}>{children}</Suspense>
)

const AuthorizedRoute = (): ReactElement | null => {
  const { role } = useUserDetails()

  const userHasAuthorizedRole = role === Roles.YLLAPITAJA || role === Roles.LAATIJA || role === Roles.OPETTAJA

  if (!role) {
    return null
  } else if (!userHasAuthorizedRole) {
    return <UnauthorizedPage />
  } else {
    return <Outlet />
  }
}

const YllapitajaRoute = (): ReactElement => {
  const { isYllapitaja } = useUserDetails()

  if (!isYllapitaja) {
    return <UnauthorizedPage />
  }

  return <Outlet />
}

const DefaultError = () => {
  const { t } = useLudosTranslation()
  let error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PageNotFound />
  } else {
    console.error(error)
    return <h2>{t('error.odottamaton-virhe')}</h2>
  }
}

export const ludosRouter = createBrowserRouter([
  {
    element: <AuthorizedRoute />,
    errorElement: <DefaultError />,
    children: [
      {
        path: '/',
        element: (
          <Layout>
            <Frontpage />
          </Layout>
        )
      },
      examRoute(Exam.SUKO),
      examRoute(Exam.LD),
      examRoute(Exam.PUHVI),
      {
        index: true,
        path: `/${suosikitKey}`,
        element: <Navigate replace to={favoritesPagePath(Exam.SUKO)} />
      },
      {
        path: `/${suosikitKey}/:exam/:folderId?`,
        element: (
          <Layout>
            <AssignmentFavorite />
          </Layout>
        )
      },
      {
        path: uudelleenkirjautuminenOnnistuiPath,
        element: (
          <Layout>
            <ReauthorizeSuccessful />
          </Layout>
        )
      },
      {
        path: '/vitelogin',
        element: <Navigate replace to="/" />
      }
    ]
  }
])

function contentFormRoutes(
  contentType: ContentType,
  Form: typeof AssignmentForm | typeof InstructionForm | typeof CertificateForm
): RouteObject[] {
  return [
    {
      path: `${ContentTypePluralFi[contentType]}/${ContentFormAction.uusi}`,
      element: (
        <Layout>
          <SpinnerSuspense>
            <Form action={ContentFormAction.uusi} />
          </SpinnerSuspense>
        </Layout>
      )
    },
    {
      path: `${ContentTypePluralFi[contentType]}/${ContentFormAction.muokkaus}/:id`,
      element: (
        <Layout>
          <SpinnerSuspense>
            <Form action={ContentFormAction.muokkaus} />
          </SpinnerSuspense>
        </Layout>
      )
    }
  ]
}

function examRoute(exam: Exam): RouteObject {
  return {
    path: examPath(exam),
    children: [
      {
        index: true,
        element: <Navigate replace to={contentListPath(exam, ContentType.ASSIGNMENT)} />
      },
      {
        path: ':contentTypePluralFi',
        element: (
          <Layout>
            <SpinnerSuspense>
              <ContentListPage exam={exam} />
            </SpinnerSuspense>
          </Layout>
        )
      },
      {
        path: ':contentTypePluralFi/:id',
        element: (
          <Layout>
            <SpinnerSuspense>
              <Content exam={exam} isPresentation={false} />
            </SpinnerSuspense>
          </Layout>
        )
      },
      {
        path: `:contentTypePluralFi/:id/${tulostusnakymaKey}`,
        element: (
          <Layout header={<></>} footer={<Footer isPresentation={true} />}>
            <SpinnerSuspense>
              <PrintContent exam={exam} />
            </SpinnerSuspense>
          </Layout>
        )
      },
      {
        element: <YllapitajaRoute />,
        children: [
          {
            path: ':contentTypePluralFi/:id/:version',
            element: (
              <Layout>
                <SpinnerSuspense>
                  <Content exam={exam} isPresentation={false} />
                </SpinnerSuspense>
              </Layout>
            )
          },
          ...contentFormRoutes(ContentType.ASSIGNMENT, AssignmentForm),
          ...contentFormRoutes(ContentType.INSTRUCTION, InstructionForm),
          ...contentFormRoutes(ContentType.CERTIFICATE, CertificateForm)
        ]
      }
    ]
  }
}

export function PageNotFound() {
  const { t } = useLudosTranslation()

  return (
    <div className="p-10">
      <h2 className="text-green-primary">404</h2>
      <p>{t('error.sivua-ei-loydy')}</p>
    </div>
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
