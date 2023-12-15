import { AssignmentOut, Exam, TeachingLanguage } from '../../types'
import { useTranslation } from 'react-i18next'
import { useKoodisto } from '../../hooks/useKoodisto'
import { ContentActionRow, ContentContent, ContentInstruction } from './ContentCommon'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../../utils/assignmentUtils'
import { useState } from 'react'
import { useToggleFavorite } from '../../hooks/useToggleFavorite'

type AssignmentContentProps = {
  assignment: AssignmentOut
  exam: Exam
  teachingLanguage: TeachingLanguage
  isPresentation: boolean
}

export const AssignmentContent = ({ assignment, exam, teachingLanguage, isPresentation }: AssignmentContentProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto()
  const [isFavorite, setIsFavorite] = useState(assignment.isFavorite)

  const { toggleFavorite } = useToggleFavorite({
    exam,
    assignmentId: assignment.id,
    isFavorite,
    setIsFavorite
  })

  const handleToggleFavoriteClick = async () => await toggleFavorite()

  const suko = isSukoAssignment(assignment)
  const puhvi = isPuhviAssignment(assignment)
  const ld = isLdAssignment(assignment)

  return (
    <>
      {!isPresentation && (
        <div className="my-3 bg-gray-bg px-3 pb-3 pt-2 border border-gray-light" data-testid="assignment-metadata">
          <ul>
            {suko && (
              <>
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.oppimaara')}:</span>
                  <span data-testid="suko-oppimaara">{getOppimaaraLabel(assignment.oppimaara)}</span>
                </li>
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>
                  <span data-testid="suko-tehtavatyyppi">
                    {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
                  </span>
                </li>
                {/*<li}
                {/*  <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>*/}
                {/*  <span data-testid="suko-tavoitetaso">{getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}</span>*/}
                {/*</li>*/}
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
                  <span data-testid="suko-aihe">
                    {assignment.aiheKoodiArvos.length > 0 ? getKoodisLabel(assignment.aiheKoodiArvos, 'aihesuko') : '-'}
                  </span>
                </li>
              </>
            )}
            <>
              {puhvi && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>
                  <span data-testid="puhvi-tehtavatyyppi">
                    {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi')}
                  </span>
                </li>
              )}
              {(ld || puhvi) && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.lukuvuosi')}:</span>
                  <span data-testid="ld-puhvi-lukuvuosi">
                    {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
                  </span>
                </li>
              )}
              {ld && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
                  <span data-testid="ld-aine">{getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine')}</span>
                </li>
              )}
              <li>
                <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
                <span data-testid="laajaalainenosaaminen">
                  {getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')}
                </span>
              </li>
            </>
          </ul>

          <ContentActionRow
            contentId={assignment.id}
            isFavorite={isFavorite}
            onFavoriteClick={handleToggleFavoriteClick}
            pdfData={{
              baseOut: assignment,
              language: teachingLanguage
            }}
          />
        </div>
      )}

      <ContentInstruction
        teachingLanguage={teachingLanguage}
        instructionFi={assignment.instructionFi}
        instructionSv={assignment.instructionSv}
      />

      <div className="mb-4 border-b border-gray-separator" />

      <ContentContent
        teachingLanguage={teachingLanguage}
        contentFi={assignment.contentFi}
        contentSv={assignment.contentSv}
      />
    </>
  )
}
