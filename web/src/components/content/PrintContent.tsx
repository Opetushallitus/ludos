import React, { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { LudosContext } from '../../contexts/LudosContext'
import { useFetch } from '../../hooks/useFetch'
import {
  ContentBaseOut,
  ContentType,
  ContentTypeByContentTypePluralFi,
  ContentTypePluralFi,
  ContentTypeSingularEn,
  Exam,
  isAssignment,
  isCertificate,
  isInstruction,
  Language
} from '../../types'
import { PageLoadingIndicator } from '../PageLoadingIndicator'
import { AssignmentContentWithoutFavorites } from './AssignmentContent'
import { CertificateContent } from './CertificateContent'
import { ContentHeader } from './ContentCommon'
import { ContentError } from './ContentError'
import { FeedbackLink } from './FeedbackLink'
import { InstructionContent } from './InstructionsContent'
import { PrintButton } from './PrintButton'

type ContentProps = {
  exam: Exam
}

const Content = ({ exam }: ContentProps) => {
  const { contentTypePluralFi, id, version } = useParams<{
    contentTypePluralFi: ContentTypePluralFi
    id: string
    version: string
  }>()
  const { teachingLanguage } = useContext(LudosContext)
  const contentType = ContentTypeByContentTypePluralFi[contentTypePluralFi!]

  const isVersionBrowser = !!version

  const teachingLanguageOverride =
    exam === Exam.SUKO && contentType === ContentType.CERTIFICATE ? Language.FI : teachingLanguage

  const { data, isFetching, error } = useFetch<ContentBaseOut>(
    ['content'],
    `${ContentTypeSingularEn[contentType!]}/${exam}/${id}${isVersionBrowser ? `/${version}` : ''}`
  )

  if (isFetching) {
    return <PageLoadingIndicator />
  }

  if (error) {
    return <ContentError contentType={contentType!} error={error} />
  }

  if (!data || !contentType) {
    return null
  }

  return (
    <div className="min-h-[80vh] mt-5 print-content" data-testid="print-content">
      <div className="row">
        <div className="col w-full pr-5 md:w-9/12">
          <div className="row pb-3">
            <div className="col min-h-[40vh] w-full">
              <ContentHeader teachingLanguage={teachingLanguageOverride} data={data} />

              {contentType === ContentType.ASSIGNMENT && isAssignment(data) && (
                <AssignmentContentWithoutFavorites assignment={data} teachingLanguage={teachingLanguage} />
              )}

              {contentType === ContentType.CERTIFICATE && isCertificate(data) && (
                <CertificateContent certificate={data} teachingLanguage={teachingLanguage} />
              )}
              {contentType === ContentType.INSTRUCTION && isInstruction(data) && (
                <InstructionContent
                  instruction={data}
                  teachingLanguage={teachingLanguage}
                  isVersionBrowser={isVersionBrowser}
                />
              )}
            </div>
          </div>

          <PrintButton />
          <FeedbackLink />
        </div>
      </div>
    </div>
  )
}

export default Content
