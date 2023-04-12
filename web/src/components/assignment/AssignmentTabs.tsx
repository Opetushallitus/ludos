import { AssignmentType, AssignmentTypes } from '../../types'

type AssignmentTabsProps = {
  activeTab: AssignmentType
  setActiveTab: (tab: AssignmentType) => void
}

export const AssignmentTabs = ({ activeTab, setActiveTab }: AssignmentTabsProps) => (
  <div className="text-gray-500 text-center text-base">
    <div className="flex flex-wrap border-b-2 border-gray-separator font-semibold" role="tablist">
      {Object.values(AssignmentTypes).map((option, i) => (
        <button
          role="tab"
          className={`inline-block cursor-pointer rounded-t-lg px-3 py-1 hover:bg-gray-light capitalize${
            activeTab === option ? ' border-b-5 border-b-green-primary text-green-primary' : ''
          }`}
          onClick={() => setActiveTab(option)}
          key={i}>
          {option}
        </button>
      ))}
    </div>
  </div>
)
