import { useParams } from 'react-router-dom'
import { ContentType, ContentTypeByContentTypePluralFi, ContentTypePluralFi, Exam } from '../../../types'
import { AssignmentList } from './assignment/AssignmentList'
import { ContentTypeMenu } from '../../ContentTypeMenu'
import { useFilterValues } from '../../../hooks/useFilterValues'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { InstructionList } from './instruction/InstructionList'
import { CertificateList } from './certificate/CertificateList'

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
    <div className="mt-10">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {lt.headingTextByExam[exam]}
      </h2>

      <ContentTypeMenu exam={exam} />

      <div role="tabpanel">
        {
          <>
            {contentType === ContentType.ASSIGNMENT ? (
              <AssignmentList {...commonProps} />
            ) : contentType === ContentType.INSTRUCTION ? (
              <InstructionList {...commonProps} />
            ) : (
              <CertificateList {...commonProps} />
            )}
          </>
        }
      </div>
    </div>
  )
}

export default ContentListPage
