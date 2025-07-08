import { Fragment } from 'react'
import { INSTRUCTION_URL } from '../../constants'
import { useKoodisto } from '../../hooks/useKoodisto'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Exam, InstructionDtoOut, Language, LdInstructionDtoOut, SukoOrPuhviInstructionDtoOut } from '../../types'
import { ExternalLink } from '../ExternalLink'
import { ContentContent } from './ContentCommon'

type InstructionContentProps = {
  instruction: SukoOrPuhviInstructionDtoOut | LdInstructionDtoOut
  teachingLanguage: Language
  isVersionBrowser: boolean
}

export const InstructionContent = ({ instruction, teachingLanguage, isVersionBrowser }: InstructionContentProps) => {
  const { t } = useLudosTranslation()
  const { getKoodiLabel } = useKoodisto(teachingLanguage)
  const attachmentsFilteredWithLanguage = instruction.attachments
    .filter((it) => it.language === teachingLanguage)
    .map((it) => it)

  const isLdInstruction = (instruction: InstructionDtoOut, exam: Exam): instruction is LdInstructionDtoOut =>
    exam === Exam.LD && 'aineKoodiArvo' in instruction

  return (
    <>
      <div className="my-3">
        {isLdInstruction(instruction, Exam.LD) && (
          <ul className="px-3 pb-3 pt-2 bg-gray-bg border border-gray-light">
            <li>
              <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
              <span data-testid="instruction-aine">
                {getKoodiLabel(instruction.aineKoodiArvo, 'ludoslukiodiplomiaine')}
              </span>
            </li>
          </ul>
        )}
      </div>

      {!isLdInstruction(instruction, Exam.LD) && (
        <>
          <div className="mb-4">
            <p className="text-sm">
              {teachingLanguage === Language.FI ? instruction.shortDescriptionFi : instruction.shortDescriptionSv}
            </p>
          </div>
          <div className="mb-4 border-b border-gray-separator" />
        </>
      )}

      <ContentContent
        teachingLanguage={teachingLanguage}
        content={teachingLanguage === Language.FI ? instruction.contentFi : instruction.contentSv}
      />

      {attachmentsFilteredWithLanguage.length > 0 && (
        <div className="mb-4 mt-3">
          <p className="mb-2 font-semibold">{t('content.tiedostot')}</p>
          {attachmentsFilteredWithLanguage.map((attachment, index) => (
            <Fragment key={index}>
              <ExternalLink
                className="text-green-primary"
                url={`${INSTRUCTION_URL}/${instruction.exam}/attachment/${attachment.fileKey}${isVersionBrowser ? `/${instruction.version}` : ''}`}
                data-testid="attachment-link"
              >
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
