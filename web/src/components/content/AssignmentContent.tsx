import {
  AssignmentOut,
  ContentTypeSingularEn,
  FavoriteAction,
  FavoriteIdsDtoOut,
  isLdAssignment,
  isPuhviAssignment,
  isSukoAssignment,
  Language
} from '../../types'
import { useKoodisto } from '../../hooks/useKoodisto'
import { ContentActionRow, ContentContent, ContentInstruction } from './ContentCommon'
import { ReactNode, useState } from 'react'
import { useSetFavoriteFolders } from '../../hooks/useSetFavoriteFolders'
import { SetFavoriteFoldersModal } from '../modal/favoriteModal/SetFavoriteFoldersModal'
import { useFetch } from '../../hooks/useFetch'
import { FavoriteToggleModalFormType } from '../modal/favoriteModal/favoriteToggleModalFormSchema'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { isSukoKertomisTehtavaAndSpecificOppimaara } from '../../utils/assignmentUtils'

type AssignmentContentProps = {
  assignment: AssignmentOut
  teachingLanguage: Language
}

export function getInstructionToShow(
  assignment: AssignmentOut,
  teachingLanguage: Language,
): string {
  const showFinnishInstruction = isSukoAssignment(assignment)

  return teachingLanguage === Language.FI || showFinnishInstruction ? assignment.instructionFi : assignment.instructionSv
}

function getContentLang(assignment: AssignmentOut, teachingLanguage: Language): Language {
  if (isSukoKertomisTehtavaAndSpecificOppimaara(assignment)) {
    return teachingLanguage
  }
  if (isSukoAssignment(assignment)) {
    return 'FI'
  }
  return teachingLanguage
}

type AssignmentContentWithoutFavoritesProps = { contentAction?: ReactNode | undefined } & AssignmentContentProps

export const AssignmentContentWithoutFavorites = (
  { assignment, teachingLanguage, contentAction }:
  AssignmentContentWithoutFavoritesProps) => {

  const instructionToShow = getInstructionToShow(assignment, teachingLanguage)
  const contentLang = getContentLang(assignment, teachingLanguage)

  return (
    <>
      <div
        className="my-3 bg-gray-bg px-3 pb-3 pt-2 border border-gray-light print-color-adjust-exact"
        data-testid="assignment-metadata">
        <AssignmentMetadata assignment={assignment} />
        {contentAction}
      </div>

      <ContentInstruction teachingLanguage={teachingLanguage} content={instructionToShow} />
      <div className="mb-4 border-b border-gray-separator" />
      <ContentContent
        teachingLanguage={teachingLanguage}
        content={contentLang === Language.FI ? assignment.contentFi : assignment.contentSv}
      />
    </>
  )
}

const AssignmentContentWithFavorites = ({ assignment, teachingLanguage }: AssignmentContentProps) => {
  const { t } = useLudosTranslation()
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false)

  const { data: favoriteIds, refetch: refetchFavoriteData } = useFetch<FavoriteIdsDtoOut>(
    ['favoriteIds'],
    `${ContentTypeSingularEn.ASSIGNMENT}/favorites/${assignment.exam.toLocaleUpperCase()}/${assignment.id}`
  )

  const { setFavoriteFolders, unFavorite } = useSetFavoriteFolders(refetchFavoriteData)
  const isFavorite = (favoriteIds && favoriteIds?.folderIdsByAssignmentId[assignment.id] !== undefined) || false

  const onSetFavoriteFoldersAction = async (data: FavoriteToggleModalFormType) => {
    await setFavoriteFolders({ data, favoriteAction: isFavorite ? FavoriteAction.EDIT : FavoriteAction.ADD })
    setIsFavoriteModalOpen(false)
  }

  const action = (
    <ContentActionRow
      isFavorite={isFavorite}
      onFavoriteClick={() => {
        isFavorite ? unFavorite(assignment) : setIsFavoriteModalOpen(true)
      }}
      disabled={!favoriteIds}
    />
  )

  return (
    <>
      <AssignmentContentWithoutFavorites
        assignment={assignment}
        teachingLanguage={teachingLanguage}
        contentAction={action} />

      {isFavoriteModalOpen && favoriteIds && (
        <SetFavoriteFoldersModal
          isFavorite={isFavorite}
          assignmentCard={assignment}
          favoriteIds={favoriteIds}
          assignmentName={
            (teachingLanguage === Language.FI ? assignment.nameFi : assignment.nameSv) || t('form.nimeton')
          }
          onClose={() => setIsFavoriteModalOpen(false)}
          onSetFavoriteFoldersAction={onSetFavoriteFoldersAction}
        />
      )}
    </>
  )
}

export { AssignmentContentWithFavorites as AssignmentContent }

interface AssignmentMetadataProps {
  assignment: AssignmentOut,
}

export const AssignmentMetadata = ({assignment}: AssignmentMetadataProps) => {

  const { t } = useLudosTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto()

  return (
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
  )
}
