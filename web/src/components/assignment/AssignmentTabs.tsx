import { TFunction } from 'i18next'
import { ExamType, ExamTypes } from '../../types'
import { Button } from '../Button'

type AssignmentTabsProps = {
  activeTab: ExamType
  setActiveTab: (tab: ExamType) => void
  t: TFunction
}

export const AssignmentTabs = ({ activeTab, setActiveTab, t }: AssignmentTabsProps) => (
  <div className="text-gray-500 text-center text-base">
    <div className="flex flex-wrap border-b-2 border-gray-separator font-semibold" role="tablist">
      {Object.values(ExamTypes).map((option, i) => (
        <Button
          variant="buttonGhost"
          role="tab"
          className={`inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light${
            activeTab === option ? ' border-b-5 border-b-green-primary text-green-primary' : ''
          }`}
          onClick={() => setActiveTab(option)}
          key={i}
          data-testid={`tab-${option}`}>
          {t(`tab.${option}`)}
        </Button>
      ))}
    </div>
  </div>
)
