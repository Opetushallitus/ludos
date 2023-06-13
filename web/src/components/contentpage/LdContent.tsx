import { ContentTypeEng, LdAssignmentIn } from '../../types'
import { useTranslation } from 'react-i18next'
import { ContentContent, ContentIconRow, ContentInstruction } from './ContentCommon'
import { useKoodisto } from '../../hooks/useKoodisto'
import { isCertificate } from '../exam/assignment/assignmentUtils'
import { UploadedFile } from '../exam/assignment/form/formCommon/FileUpload'

type LdAssignmentContentProps = {
  assignment: LdAssignmentIn
  language: string
  contentType: string
}

export const LdContent = ({ assignment, contentType, language }: LdAssignmentContentProps) => {
  const { t } = useTranslation()

  const { getKoodisLabel, getKoodiLabel } = useKoodisto()

  return (
    <>
      {contentType !== ContentTypeEng.TODISTUKSET && (
        <div className="my-3 bg-gray-bg p-3">
          {contentType === ContentTypeEng.KOETEHTAVAT && (
            <ul>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.lukuvuosi')}:</span>
                {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
              </li>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
                {getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine')}
              </li>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
                {getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')}
              </li>
            </ul>
          )}

          <ContentIconRow />
        </div>
      )}

      {isCertificate(assignment, contentType) ? (
        <div>
          <h3 className="mt-8 font-semibold">nimi</h3>
          <p>{assignment.nameFi}</p>
          <h3 className="mt-8 font-semibold">kuvaus</h3>
          <p>{assignment.contentFi}</p>
          <h3 className="mb-3 mt-8 font-semibold">Todistus</h3>
          <UploadedFile
            file={{
              fileName: assignment.fileName,
              fileUrl: assignment.fileUrl,
              fileUploadDate: assignment.fileUploadDate
            }}
          />
        </div>
      ) : (
        <>
          <ContentInstruction
            language={language}
            instructionFi={assignment.instructionFi}
            instructionSv={assignment.instructionSv}
          />

          <div className="mb-4 border-b border-gray-separator" />

          <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
        </>
      )}
    </>
  )
}
