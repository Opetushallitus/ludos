import { useTranslation } from 'react-i18next'
import { PublishState } from '../types'
import { twMerge } from 'tailwind-merge'

type TagAttributes = {
  localizationKey: string
  variant: string
}

export const StateTag = ({ state }: { state: PublishState }) => {
  const { t } = useTranslation()
  const tagAttributes = getTagAttributes(state)

  function getTagAttributes(state: PublishState): TagAttributes {
    switch (state) {
      case PublishState.Draft:
        return { localizationKey: t('state.luonnos'), variant: 'bg-yellow' }
      case PublishState.Published:
        return { localizationKey: t('state.julkaistu'), variant: 'bg-green-light' }
      case PublishState.Archived:
        return { localizationKey: t('state.arkistoitu'), variant: 'bg-gray-secondary' }
    }
  }

  return (
    <div className={twMerge('w-20 rounded-sm text-center text-xs', tagAttributes.variant)} data-testid="publish-state">
      {tagAttributes.localizationKey}
    </div>
  )
}
