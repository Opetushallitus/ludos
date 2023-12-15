import { useParams } from 'react-router-dom'
import { ContentType, Exam } from '../../../types'
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
  const { contentType: contentTypeParam } = useParams<{ contentType: ContentType }>()
  const contentType = contentTypeParam || ContentType.koetehtavat
  const filterValues = useFilterValues(exam)

  const commonProps = { exam, filterValues }

  return (
    <div className="mt-10">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {lt.headingTextByExam[exam]}
      </h2>

      <ContentTypeMenu exam={exam} />

      <div role="tabpanel">
        {contentType && (
          <>
            {contentType === ContentType.koetehtavat ? (
              <AssignmentList {...commonProps} />
            ) : contentType === ContentType.ohjeet ? (
              <InstructionList {...commonProps} />
            ) : (
              <CertificateList {...commonProps} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ContentListPage
