import { InstructionIn } from '../../types'
import { ContentActionRow, ContentContent, ContentInstruction } from './ContentCommon'
import { ExternalLink } from '../ExternalLink'
import { DOWNLOAD_INSTRUCTION_ATTACHMENT_URL } from '../../constants'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

type InstructionContentProps = {
  instruction: InstructionIn
  language: string
}

export const InstructionContent = ({ instruction, language }: InstructionContentProps) => {
  const { t } = useTranslation()
  const attachmentsFilteredWithLanguage = instruction.attachments
    .filter((it) => it.language.toLowerCase() === language)
    .map((it) => it)

  return (
    <>
      <div className="my-3 bg-gray-bg px-3 pb-3 pt-2">
        <ContentActionRow />
      </div>
      <ContentInstruction
        language={language}
        instructionFi={instruction.instructionFi}
        instructionSv={instruction.instructionSv}
      />

      <div className="mb-4">
        <p className="text-sm">{language === 'fi' ? instruction.shortDescriptionFi : instruction.shortDescriptionSv}</p>
      </div>

      <div className="mb-4 border-b border-gray-separator" />

      <ContentContent language={language} contentFi={instruction.contentFi} contentSv={instruction.contentSv} />

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
