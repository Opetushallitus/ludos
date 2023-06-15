import { ContentTypeEng, SukoAssignmentIn } from '../../types'
import { useTranslation } from 'react-i18next'
import { ContentContent, ContentIconRow, ContentInstruction } from './ContentCommon'
import { useKoodisto } from '../../hooks/useKoodisto'
import { UploadedFile } from '../exam/assignment/form/formCommon/FileUpload'
import { isCertificate } from '../exam/assignment/assignmentUtils'

type SukoAssignmentContentProps = {
  assignment: SukoAssignmentIn
  contentType: string
  language: string
}
export const SukoContent = ({ assignment, contentType, language }: SukoAssignmentContentProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel } = useKoodisto()

  return (
    <>
      {contentType !== ContentTypeEng.TODISTUKSET && (
        <div className="my-3 bg-gray-bg px-3 pb-3 pt-2">
          {contentType === ContentTypeEng.KOETEHTAVAT && (
            <ul>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>{' '}
                {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
              </li>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>
                {getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}
              </li>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
                {assignment.aiheKoodiArvos.length > 0 ? getKoodisLabel(assignment.aiheKoodiArvos, 'aihesuko') : '-'}
              </li>
              <li>
                <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
                {assignment.laajaalainenOsaaminenKoodiArvos.length > 0
                  ? getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')
                  : '-'}
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
              fileKey: assignment.fileKey,
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
