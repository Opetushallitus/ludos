import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../Button'
import { Icon } from '../Icon'

type HeaderFavoritesProps = {
  onClick: () => void
  userFavoriteAssignmentCount: number
  isMobile?: boolean
}

export const HeaderFavorites = ({ onClick, userFavoriteAssignmentCount, isMobile }: HeaderFavoritesProps) => {
  const { t } = useTranslation()

  return (
    <Button
      variant="buttonGhost"
      customClass="flex justify-center gap-1 border-l-2 border-green-primary py-0 pr-2"
      onClick={onClick}
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
    </Button>
  )
}
