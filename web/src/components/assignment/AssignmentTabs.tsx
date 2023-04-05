import { AssignmentType, AssignmentTypes } from '../../types'

type AssignmentTabsProps = {
  activeTab: AssignmentType
  setActiveTab: (tab: AssignmentType) => void
}

export function AssignmentTabs({ activeTab, setActiveTab }: AssignmentTabsProps) {
  return (
    <div className="text-gray-500 text-center text-base">
      <ul className="flex flex-wrap border-b-2 border-gray-separator font-semibold">
        {Object.values(AssignmentTypes).map((option, i) => (
          <li
            className={`mr-2${activeTab === option ? ' border-b-5 border-b-green-primary text-green-primary' : ''}`}
            key={i}>
            <a
              className="inline-block cursor-pointer rounded-t-lg px-3 py-1 capitalize"
              onClick={() => setActiveTab(option)}>
              {option}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
