import {
  AssignmentOut,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  FavoriteIdsDtoOut,
  TeachingLanguage
} from '../../types'
import { useTranslation } from 'react-i18next'
import { useKoodisto } from '../../hooks/useKoodisto'
import { ContentActionRow, ContentContent, ContentInstruction } from './ContentCommon'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../../utils/assignmentUtils'
import { useState } from 'react'
import { useSetFavoriteFolders } from '../../hooks/useSetFavoriteFolders'
import { SetFavoriteFoldersModal } from '../modal/favoriteModal/SetFavoriteFoldersModal'
import { useFetch } from '../../hooks/useFetch'

type AssignmentContentProps = {
  assignment: AssignmentOut
  exam: Exam
  teachingLanguage: TeachingLanguage
  isPresentation: boolean
}

export const AssignmentContent = ({ assignment, exam, teachingLanguage, isPresentation }: AssignmentContentProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto()
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false)

  const { data: favoriteIds, refresh: refreshFavoriteIds } = useFetch<FavoriteIdsDtoOut>(
    `${ContentTypeSingularEng[ContentType.koetehtavat]}/favorites/${exam.toLocaleUpperCase()}/${assignment.id}`
  )

  const isFavorite = (favoriteIds && favoriteIds?.folderIdsByAssignmentId[assignment.id] !== undefined) || false

  const { setFavoriteFolders } = useSetFavoriteFolders({})

  return (
    <>
      {!isPresentation && (
        <div className="my-3 bg-gray-bg px-3 pb-3 pt-2 border border-gray-light" data-testid="assignment-metadata">
          <ul>
            {isSukoAssignment(assignment) && (
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
              {isPuhviAssignment(assignment) && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>
                  <span data-testid="puhvi-tehtavatyyppi">
                    {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi')}
                  </span>
                </li>
              )}
              {(isLdAssignment(assignment) || isPuhviAssignment(assignment)) && (
                <li>
                  <span className="pr-1 font-semibold">{t('assignment.lukuvuosi')}:</span>
                  <span data-testid="ld-puhvi-lukuvuosi">
                    {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
                  </span>
                </li>
              )}
              {isLdAssignment(assignment) && (
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
            isFavorite={isFavorite}
            onFavoriteClick={() => setIsFavoriteModalOpen(true)}
            pdfData={{
              baseOut: assignment,
              language: teachingLanguage,
              contentType: ContentType.koetehtavat
            }}
            disabled={!favoriteIds}
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

      {isFavoriteModalOpen && favoriteIds && (
        <SetFavoriteFoldersModal
          isFavorite={isFavorite}
          assignmentCard={assignment}
          favoriteIds={favoriteIds}
          assignmentName={
            (teachingLanguage === TeachingLanguage.fi ? assignment.nameFi : assignment.nameSv) || t('form.nimeton')
          }
          onClose={() => setIsFavoriteModalOpen(false)}
          onSetFavoriteFoldersAction={async (favoriteCards) => {
            await setFavoriteFolders(favoriteCards)
            refreshFavoriteIds()
            setIsFavoriteModalOpen(false)
          }}
        />
      )}
    </>
  )
}
