import { useParams } from 'react-router-dom'
import { ContentType, ContentTypeByContentTypePluralFi, ContentTypePluralFi, Exam } from '../../../types'
import { AssignmentList } from './assignment/AssignmentList'
import { useFilterValues } from '../../../hooks/useFilterValues'
import { InstructionList } from './instruction/InstructionList'
import { CertificateList } from './certificate/CertificateList'
import { ListTabs } from '../../ListTabs'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

type ContentListPageProps = {
  exam: Exam
}

const ContentListPage = ({ exam }: ContentListPageProps) => {
  const { lt } = useLudosTranslation()
  const { contentTypePluralFi } = useParams<{ contentTypePluralFi: ContentTypePluralFi }>()
  const contentType = ContentTypeByContentTypePluralFi[contentTypePluralFi!]
  const filterValues = useFilterValues(exam)

  const commonProps = { exam, filterValues }

  return (
    <div className="min-h-[80vh] mt-10">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {lt.headingTextByExam[exam]}
      </h2>

      <ListTabs exam={exam} />

      <div role="tabpanel">
        {contentType === ContentType.ASSIGNMENT ? (
          <AssignmentList {...commonProps} />
        ) : contentType === ContentType.INSTRUCTION ? (
          <InstructionList {...commonProps} />
        ) : (
          <CertificateList {...commonProps} />
        )}
      </div>
    </div>
  )
}

export default ContentListPage
