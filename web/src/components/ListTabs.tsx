import { ContentType, ContentTypePluralFi, Exam } from '../types'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { IS_MOBILE_QUERY } from '../constants'
import { twMerge } from 'tailwind-merge'
import { NavLink } from 'react-router-dom'
import { contentListPath, favoritesPagePath } from './LudosRoutes'
import { ReactNode } from 'react'

type TabsProps = {
  exam?: Exam
}

export const ListTabs = ({ exam }: TabsProps) => {
  const { lt } = useLudosTranslation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    twMerge(
      'px-2 cursor-pointer rounded-t-lg hover:bg-gray-light border-b-4 border-gray-separator',
      isActive && 'border-b-green-primary text-green-primary'
    )

  return (
    <div className="row flex-wrap font-semibold">
      {exam ? (
        <>
          {Object.values(ContentType).map((contentType: ContentType, i) => (
            <LinkWrapper key={i}>
              <NavLink
                to={contentListPath(exam, contentType)}
                className={linkClass}
                data-testid={`tab-${ContentTypePluralFi[contentType]}`}>
                {lt.tabTextByContentType[contentType]}
              </NavLink>
            </LinkWrapper>
          ))}
        </>
      ) : (
        <>
          {Object.values(Exam).map((exam, i) => (
            <LinkWrapper key={i}>
              <NavLink to={favoritesPagePath(exam)} className={linkClass} data-testid={`tab-${exam.toLowerCase()}`}>
                {lt.tabTextByExam[exam]}
              </NavLink>
            </LinkWrapper>
          ))}
        </>
      )}
    </div>
  )
}

const LinkWrapper = ({ children }: { children: ReactNode }) => {
  const isMobile = useMediaQuery({ query: IS_MOBILE_QUERY })

  return (
    <div className={twMerge('inline-block py-1 text-base text-center', isMobile && 'w-full text-left')}>{children}</div>
  )
}
