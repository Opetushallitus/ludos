import { Button } from './Button'
import { Language } from '../types'
import { Icon } from './Icon'
import { twMerge } from 'tailwind-merge'
import { useLudosTranslation } from '../hooks/useLudosTranslation'

type LanguageTabsProps = {
  activeTab: string
  setActiveTab: (opt: Language) => void
  fiErrors?: boolean
  svErrors?: boolean
}

export const LanguageTabs = ({ activeTab, setActiveTab, fiErrors, svErrors }: LanguageTabsProps) => {
  const { t } = useLudosTranslation()

  return (
    <div className="text-gray-500 text-center text-base">
      <div className="flex flex-wrap border-b-4 border-gray-separator font-semibold" role="tablist">
        {Object.values(Language).map((option, i) => (
          <Button
            variant="buttonGhost"
            role="tab"
            className={twMerge(
              'inline-flex justify-center items-center cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light',
              activeTab === option && ' -mb-1 border-b-4 border-b-green-primary text-green-primary'
            )}
            onClick={() => setActiveTab(option)}
            key={i}
            aria-expanded={activeTab === option}
            data-testid={`tab-${option}`}>
            {(option === 'FI' && fiErrors) || (option === 'SV' && svErrors) ? (
              <Icon name="virhe" color="text-red-primary" customClass="mr-2" />
            ) : null}
            <span className={(option === 'FI' && fiErrors) || (option === 'SV' && svErrors) ? 'text-red-primary' : ''}>
              {option === 'FI' ? t('tab.fi') : t('tab.sv')}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
