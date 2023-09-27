import { Button } from './Button'
import { useTranslation } from 'react-i18next'

const options = ['fi', 'sv']

type LanguageTabsProps = {
  activeTab: string
  setActiveTab: (opt: string) => void
}

export const LanguageTabs = ({ activeTab, setActiveTab }: LanguageTabsProps) => {
  const { t } = useTranslation()

  return (
    <div className="text-gray-500 text-center text-base">
      <div className="flex flex-wrap border-b-4 border-gray-separator font-semibold" role="tablist">
        {options.map((option, i) => (
          <Button
            variant="buttonGhost"
            role="tab"
            className={`inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light${
              activeTab === option ? ' -mb-1 border-b-4 border-b-green-primary text-green-primary' : ''
            }`}
            onClick={() => setActiveTab(option)}
            key={i}
            aria-expanded={activeTab === option}
            data-testid={`tab-${option}`}>
            {option === 'fi' ? t('tab.fi') : t('tab.sv')}
          </Button>
        ))}
      </div>
    </div>
  )
}
