import { TFunction } from 'i18next'
import { AssignmentType, AssignmentTypes } from '../../types'
import { FC } from 'react'
import { Button } from '../Button'

type AssignmentTabsProps = {
  activeTab: AssignmentType
  setActiveTab: (tab: AssignmentType) => void
  t: TFunction
}

export const AssignmentTabs: FC<AssignmentTabsProps> = ({ activeTab, setActiveTab, t }) => (
  <div className="text-gray-500 text-center text-base">
    <div className="flex flex-wrap border-b-2 border-gray-separator font-semibold" role="tablist">
      {Object.values(AssignmentTypes).map((option, i) => (
        <Button
          variant="buttonGhost"
          role="tab"
          className={`inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light${
            activeTab === option ? ' border-b-5 border-b-green-primary text-green-primary' : ''
          }`}
          onClick={() => setActiveTab(option)}
          key={i}
          data-testId={`tab-${option}`}>
          {t(`tab.${option}`)}
        </Button>
      ))}
    </div>
  </div>
)
