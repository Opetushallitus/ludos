import { ReactNode } from 'react'
import { Exam } from '../types'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { ListTabs } from './ListTabs'
import { ContentBreadcrumbs } from './Breadcrumbs'

export const ContentWrapper = ({
  exam,
  showHeading,
  showBreadCrumbs,
  children
}: {
  exam: Exam
  showHeading?: boolean
  showBreadCrumbs?: boolean
  children: ReactNode
}) => {
  const { lt } = useLudosTranslation()

  return (
    <div className="min-h-[80vh] mt-10">
      {showHeading && (
        <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
          {lt.headingTextByExam[exam]}
        </h2>
      )}

      {showBreadCrumbs && <ContentBreadcrumbs exam={exam} />}

      <ListTabs exam={exam} />

      {children}
    </div>
  )
}
