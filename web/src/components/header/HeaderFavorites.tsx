import React from 'react'
import { useTranslation } from 'react-i18next'
import { buttonClasses } from '../Button'
import { Icon } from '../Icon'
import { favoritesPagePath } from '../LudosRoutes'
import { InternalLink } from '../InternalLink'
import { twMerge } from 'tailwind-merge'

type HeaderFavoritesProps = {
  userFavoriteAssignmentCount: number
  isMobile?: boolean
}

export const HeaderFavorites = ({ userFavoriteAssignmentCount, isMobile }: HeaderFavoritesProps) => {
  const { t } = useTranslation()

  return (
    <InternalLink
      className={twMerge(
        buttonClasses('buttonGhost'),
        'flex justify-center gap-1 border-l border-green-primary py-0 pr-2'
      )}
      to={favoritesPagePath()}
      data-testid="header-favorites">
      {isMobile ? null : <span className="text-green-primary">{t('favorite.suosikit')}</span>}
      <div className="relative">
        <Icon name="suosikki" size="lg" color={isMobile ? 'text-white' : 'text-black'} />
        <div className="absolute top-[-0.3rem] right-[-0.75rem] bg-green-light text-white rounded-full text-xs min-w-[1.2rem] min-h-[1.1rem] flex justify-center items-center">
          <span className="px-0.5" data-testid="header-favorites-count">
            {userFavoriteAssignmentCount}
          </span>
        </div>
      </div>
    </InternalLink>
  )
}
