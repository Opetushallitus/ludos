import { Button } from '../Button'
import { Location, NavigateFunction, useLocation, useNavigate } from 'react-router-dom'
import { createKey, navigationPages } from '../routes/routes'
import { useAssignments } from './useGetAssignments'
import { useEffect, useState } from 'react'
import { AssignmentTypes, AssignmentsKey, AssignmentsSingular, AssignmentType, PageHeaders } from '../../types'
import { AssignmentTabs } from './AssignmentTabs'
import { AssignmentCard } from './AssignmentCard'

const convertAssignmentTypeToPath = (assignmentType: AssignmentType) => {
  if (assignmentType === AssignmentTypes.KOETEHTAVAT) {
    return 'assignments'
  }

  if (assignmentType === AssignmentTypes.OHJEET) {
    return 'instructions'
  }

  if (assignmentType === AssignmentTypes.TODISTUKSET) {
    return 'certificates'
  }

  return ''
}

function getOptionsKey(s: AssignmentType) {
  const key = Object.keys(AssignmentTypes).find((k) => AssignmentTypes[k as AssignmentsKey] === s) as AssignmentsKey
  return AssignmentsSingular[key]
}

function useActiveTabAndUrlPathUpdate(location: Location, navigate: NavigateFunction) {
  const [activeTab, setActiveTab] = useState<AssignmentType>(
    location.state?.assignmentType || AssignmentTypes.KOETEHTAVAT
  )

  useEffect(() => {
    if (activeTab) {
      let path = location.pathname

      // if path has "assignments" in it remove it
      if (path.includes('assignments') || path.includes('instructions') || path.includes('certificates')) {
        path = location.pathname.substring(0, location.pathname.lastIndexOf('/'))
      }

      navigate(`${path}/${convertAssignmentTypeToPath(activeTab)}`, { replace: true })
    }
  }, [activeTab, location.pathname, navigate])

  return { activeTab, setActiveTab }
}

export const Assignments = ({ rootPath }: { rootPath: PageHeaders }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { assignments } = useAssignments('SUKO')

  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate(location, navigate)

  return (
    <div className="pt-3">
      <h2>{navigationPages[rootPath].title}</h2>

      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="my-5">
        <Button
          variant="buttonPrimary"
          onClick={() => navigate(`${location.pathname}${createKey}`)}
          data-testid={`create-${activeTab}-button`}>
          + Lisää {getOptionsKey(activeTab)}
        </Button>
      </div>
      {assignments && assignments.length > 0 && (
        <ul>
          {assignments.map((assignment, i) => (
            <AssignmentCard assignment={assignment} key={i} />
          ))}
        </ul>
      )}
    </div>
  )
}
