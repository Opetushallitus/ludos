import { Icon } from '../../../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../../InternalLink'
import { ContentAction } from '../../../../hooks/useLudosTranslation'
import { Button } from '../../../Button'
import { esitysnakymaKey } from '../../../LudosRoutes'
import { AssignmentOut, ContentType, Exam, TeachingLanguage } from '../../../../types'
import { lazy, Suspense } from 'react'

type AssignmentCardContentActionButtonProps = {
  contentId: number
  contentAction: ContentAction
  exam: Exam
  isActive?: boolean
  onClickHandler?: () => void
}

function AssignmentCardContentActionButton({
  contentId,
  contentAction: { actionName, iconName, text, link },
  exam,
  isActive,
  onClickHandler
}: AssignmentCardContentActionButtonProps) {
  const className = 'flex items-center pr-3'
  const testId = `assignment-${contentId}-action-${actionName}`
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" isActive={isActive} />
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
        data-testid={testId}
      />
    )
  } else {
    return (
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={onClickHandler}
        data-testid={`assignment-${contentId.toString()}-${iconName}`}>
        {children}
      </Button>
    )
  }
}

const PdfDownloadButton = lazy(() => import('../../pdf/PdfDownloadButton'))

type AssignmentCardContentActionsProps = {
  contentId: number
  exam: Exam
  isFavorite?: boolean
  onFavoriteClick?: () => void
  pdfData: { assignment: AssignmentOut; language: TeachingLanguage }
}

export const AssignmentCardContentActions = ({
  contentId,
  exam,
  isFavorite,
  onFavoriteClick,
  pdfData
}: AssignmentCardContentActionsProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly md:w-4/12 md:justify-end">
      <AssignmentCardContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.katselunakyma'),
          link: esitysnakymaKey
        }}
        exam={exam}
        key="uusi-valilehti"
      />
      <Suspense
        fallback={
          <Button variant="buttonGhost" customClass="p-0 flex items-center pr-3" disabled>
            <Icon name="pdf" color="text-green-primary" />
            <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
          </Button>
        }>
        <PdfDownloadButton baseOut={pdfData.assignment} language={pdfData.language} />
      </Suspense>
      <AssignmentCardContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'suosikki',
          iconName: 'suosikki',
          text: isFavorite ? t('favorite.poista-suosikeista') : t('favorite.lisaa-suosikiksi')
        }}
        exam={exam}
        onClickHandler={onFavoriteClick}
        isActive={isFavorite}
        key="suosikki"
      />
    </div>
  )
}
