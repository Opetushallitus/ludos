import {
  Exam,
  InstructionDtoOut,
  LdInstructionDtoOut,
  SukoOrPuhviInstructionDtoOut,
  TeachingLanguage
} from '../../types'
import { ContentActionRow, ContentContent } from './ContentCommon'
import { ExternalLink } from '../ExternalLink'
import { DOWNLOAD_INSTRUCTION_ATTACHMENT_URL } from '../../constants'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useKoodisto } from '../../hooks/useKoodisto'

type InstructionContentProps = {
  instruction: SukoOrPuhviInstructionDtoOut | LdInstructionDtoOut
  teachingLanguage: TeachingLanguage
  isPresentation: boolean
}

export const InstructionContent = ({ instruction, teachingLanguage, isPresentation }: InstructionContentProps) => {
  const { t } = useTranslation()
  const { getKoodiLabel } = useKoodisto()
  const attachmentsFilteredWithLanguage = instruction.attachments
    .filter((it) => it.language.toLowerCase() === teachingLanguage)
    .map((it) => it)

  const isLdInstruction = (instruction: InstructionDtoOut, exam: Exam): instruction is LdInstructionDtoOut =>
    exam === Exam.LD && 'aineKoodiArvo' in instruction

  return (
    <>
      {!isPresentation && (
        <div className="my-3 bg-gray-bg px-3 pb-3 pt-2 border border-gray-light">
          {isLdInstruction(instruction, Exam.LD) && (
            <ul>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
                <span data-testid="instruction-aine">
                  {getKoodiLabel(instruction.aineKoodiArvo, 'ludoslukiodiplomiaine')}
                </span>
              </li>
            </ul>
          )}
          <ContentActionRow
            contentId={instruction.id}
            pdfData={{
              baseOut: instruction,
              language: teachingLanguage
            }}
          />
        </div>
      )}

      {!isLdInstruction(instruction, Exam.LD) && (
        <>
          <div className="mb-4">
            <p className="text-sm">
              {teachingLanguage === TeachingLanguage.fi
                ? instruction.shortDescriptionFi
                : instruction.shortDescriptionSv}
            </p>
          </div>
          <div className="mb-4 border-b border-gray-separator" />
        </>
      )}

      <ContentContent
        teachingLanguage={teachingLanguage}
        contentFi={instruction.contentFi}
        contentSv={instruction.contentSv}
      />

      {attachmentsFilteredWithLanguage.length > 0 && (
        <div className="mb-4 mt-3">
          <p className="mb-2 font-semibold">{t('content.tiedostot')}</p>
          {attachmentsFilteredWithLanguage.map((attachment, index) => (
            <Fragment key={index}>
              <ExternalLink
                className="text-green-primary"
                url={`${DOWNLOAD_INSTRUCTION_ATTACHMENT_URL}/${attachment.fileKey}`}>
                {attachment.name}
              </ExternalLink>
              {index !== instruction.attachments.length - 1 && (
                <div className="mb-4 mt-2 border-b border-gray-separator" />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </>
  )
}
