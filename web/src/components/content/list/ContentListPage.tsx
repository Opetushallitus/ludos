import { useParams } from 'react-router-dom'
import { ContentType, ContentTypeByContentTypePluralFi, ContentTypePluralFi, Exam } from '../../../types'
import { AssignmentList } from './assignment/AssignmentList'
import { useFilterValues } from '../../../hooks/useFilterValues'
import { InstructionList } from './instruction/InstructionList'
import { CertificateList } from './certificate/CertificateList'

type ContentListPageProps = {
  exam: Exam
}

const ContentListPage = ({ exam }: ContentListPageProps) => {
  const { contentTypePluralFi } = useParams<{ contentTypePluralFi: ContentTypePluralFi }>()
  const contentType = ContentTypeByContentTypePluralFi[contentTypePluralFi!]
  const filterValues = useFilterValues(exam)

  const commonProps = { exam, filterValues }

  return (
    <div role="tabpanel">
      {contentType === ContentType.ASSIGNMENT ? (
        <AssignmentList {...commonProps} />
      ) : contentType === ContentType.INSTRUCTION ? (
        <InstructionList {...commonProps} />
      ) : (
        <CertificateList {...commonProps} />
      )}
    </div>
  )
}

export default ContentListPage
