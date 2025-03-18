import { useParams } from 'react-router-dom'
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
import { useFetch } from '../../hooks/useFetch'
import { ContentHeader } from './ContentCommon'
import { AssignmentContentWithoutFavorites } from './AssignmentContent'
import { CertificateContent } from './CertificateContent'
import { InstructionContent } from './InstructionsContent'
import React, { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { ContentError } from './ContentError'
import { PageLoadingIndicator } from '../PageLoadingIndicator'
import { FeedbackLink } from './FeedbackLink'

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
  const isPresentation = true

  const isVersionBrowser = !!version

  const teachingLanguageOverride =
    exam === Exam.SUKO && contentType === ContentType.CERTIFICATE
      ? Language.FI
      : teachingLanguage

  const {
    data,
    isFetching,
    error,
  } = useFetch<ContentBaseOut>(
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
    <div className="min-h-[80vh] mt-5">
      <div className="row">
        <div className="col w-full pr-5 md:w-9/12">
          <div className="row pb-3">
            <div className="col min-h-[40vh] w-full">
              <ContentHeader teachingLanguage={teachingLanguageOverride} data={data} isPresentation={isPresentation} />

              {contentType === ContentType.ASSIGNMENT && isAssignment(data) && (
                <AssignmentContentWithoutFavorites
                  assignment={data}
                  isPresentation={false}
                  teachingLanguage={teachingLanguage} />
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

          <FeedbackLink />

        </div>
      </div>
    </div>
  )
}

export default Content
