import { twMerge } from 'tailwind-merge'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { PublishState } from '../types'

type TagAttributes = {
  localizationKey: string
  variant: string
}

export const StateTag = ({ state }: { state: PublishState }) => {
  const { t } = useLudosTranslation()
  const tagAttributes = getTagAttributes(state)

  function getTagAttributes(state: PublishState): TagAttributes {
    switch (state) {
      case PublishState.Draft:
        return { localizationKey: t('state.luonnos'), variant: 'bg-yellow' }
      case PublishState.Published:
        return { localizationKey: t('state.julkaistu'), variant: 'bg-green-light' }
      case PublishState.Deleted:
        return {
          localizationKey: '',
          variant: ''
        }
    }
  }

  return (
    <div className={twMerge('w-20 rounded-sm text-center text-xs', tagAttributes.variant)} data-testid="publish-state">
      {tagAttributes.localizationKey}
    </div>
  )
}
