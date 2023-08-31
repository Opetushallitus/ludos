import { AssignmentIn, Exam } from '../../types'
import { useTranslation } from 'react-i18next'
import { useKoodisto } from '../../hooks/useKoodisto'
import { ContentContent, ContentActionRow, ContentInstruction } from './ContentCommon'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../exam/assignment/assignmentUtils'

type AssignmentContentProps = {
  assignment: AssignmentIn
  exam: Exam
  language: string
  isPresentation: boolean
}
export const AssignmentContent = ({ assignment, exam, language, isPresentation }: AssignmentContentProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel } = useKoodisto()

  const suko = isSukoAssignment(assignment, exam)
  const puhvi = isPuhviAssignment(assignment, exam)
  const ld = isLdAssignment(assignment, exam)

  return (
    <>
      {!isPresentation && (
        <div className="my-3 bg-gray-bg px-3 pb-3 pt-2">
          <ul>
            {suko && (
              <>
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>{' '}
                  {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
                </li>
                {/*<li>*/}
                {/*  <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>*/}
                {/*  {getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}*/}
                {/*</li>*/}
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
                  {assignment.aiheKoodiArvos.length > 0 ? getKoodisLabel(assignment.aiheKoodiArvos, 'aihesuko') : '-'}
                </li>
              </>
            )}
            <>
              {puhvi && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>
                  {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi')}
                </li>
              )}
              {(ld || puhvi) && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.lukuvuosi')}:</span>
                  {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
                </li>
              )}
              {ld && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
                  {getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine')}
                </li>
              )}
              <li>
                <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
                {getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')}
              </li>
            </>
          </ul>
          <ContentActionRow />
        </div>
      )}

      <ContentInstruction
        language={language}
        instructionFi={assignment.instructionFi}
        instructionSv={assignment.instructionSv}
      />

      <div className="mb-4 border-b border-gray-separator" />

      <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
    </>
  )
}
