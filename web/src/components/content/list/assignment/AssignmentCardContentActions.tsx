import { Icon } from '../../../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../../InternalLink'
import { ContentAction } from '../../../../hooks/useLudosTranslation'
import { Button } from '../../../Button'
import { esitysnakymaKey } from '../../../LudosRoutes'
import { AssignmentCardOut, ContentType, TeachingLanguage } from '../../../../types'
import { lazy, Suspense } from 'react'

type AssignmentCardContentActionButtonProps = {
  assignment: AssignmentCardOut
  contentAction: ContentAction
  isIconFilled?: boolean
  onClickHandler?: () => void
  isDisabled?: boolean
}

function AssignmentCardContentActionButton({
  assignment: { id: contentId, exam },
  contentAction: { actionName, iconName, text, link },
  isIconFilled,
  onClickHandler,
  isDisabled
}: AssignmentCardContentActionButtonProps) {
  const className = 'flex items-center pr-3'
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" filled={isIconFilled} />
      <span className="ml-1 text-xs text-green-primary">{text}</span>
    </>
  )

  if (link) {
    return (
      <InternalLink
        to={`/${exam}/${ContentType.koetehtavat}/${contentId}/${link}`}
        target="_blank"
        className={className}
        children={children}
        disabled={isDisabled}
        data-testid={actionName}
      />
    )
  } else {
    return (
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={onClickHandler}
        disabled={isDisabled}
        data-testid={actionName}>
        {children}
      </Button>
    )
  }
}

const PdfDownloadButton = lazy(() => import('../../pdf/PdfDownloadButton'))

type AssignmentCardContentActionsProps = {
  assignment: AssignmentCardOut
  isFavorite?: boolean
  onFavoriteClick?: () => void
  isFavoriteButtonDisabled: boolean
  language: TeachingLanguage
}

export const AssignmentCardContentActions = ({
  assignment,
  isFavorite,
  onFavoriteClick,
  isFavoriteButtonDisabled,
  language
}: AssignmentCardContentActionsProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly md:w-4/12 md:justify-end">
      <AssignmentCardContentActionButton
        assignment={assignment}
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.katselunakyma'),
          link: esitysnakymaKey
        }}
        key="uusi-valilehti"
      />
      <Suspense
        fallback={
          <Button variant="buttonGhost" customClass="p-0 flex items-center pr-3" disabled>
            <Icon name="pdf" color="text-green-primary" />
            <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
          </Button>
        }>
        <PdfDownloadButton exam={assignment.exam} contentId={assignment.id} language={language} />
      </Suspense>
      <AssignmentCardContentActionButton
        assignment={assignment}
        contentAction={{
          actionName: 'suosikki',
          iconName: 'suosikki',
          text: isFavorite ? t('favorite.muokkaa-suosikkeja') : t('favorite.lisaa-suosikiksi')
        }}
        onClickHandler={onFavoriteClick}
        isIconFilled={isFavorite}
        isDisabled={isFavoriteButtonDisabled}
        key="suosikki"
      />
    </div>
  )
}
