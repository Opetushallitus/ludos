import { useParams } from 'react-router-dom'
import { ContentType, Exam, TeachingLanguage } from '../../../types'
import { AssignmentList } from './assignment/AssignmentList'
import { ContentTypeMenu } from '../../ContentTypeMenu'
import { useFilterValues } from '../../../hooks/useFilterValues'
import { useState } from 'react'
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
  const [teachingLanguage, setTeachingLanguage] = useState<TeachingLanguage>(TeachingLanguage.fi)

  const languageOverrideIfSukoAssignment =
    exam === Exam.SUKO && contentType === ContentType.koetehtavat ? 'fi' : teachingLanguage

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid={`page-heading-${exam.toLowerCase()}`}>
        {lt.headingTextByExam[exam]}
      </h2>

      <ContentTypeMenu exam={exam} />

      <div role="tabpanel">
        {contentType && (
          <>
            {contentType === ContentType.koetehtavat ? (
              <AssignmentList
                exam={exam}
                teachingLanguageSelectProps={{
                  teachingLanguage: languageOverrideIfSukoAssignment,
                  setTeachingLanguage
                }}
                filterValues={filterValues}
              />
            ) : contentType === ContentType.ohjeet ? (
              <InstructionList
                exam={exam}
                teachingLanguageSelectProps={{
                  teachingLanguage: languageOverrideIfSukoAssignment,
                  setTeachingLanguage
                }}
                filterValues={filterValues}
              />
            ) : (
              <CertificateList exam={exam} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ContentListPage
