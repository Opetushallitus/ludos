import { Button } from '../Button'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { contentKey, createKey, navigationPages } from '../routes/routes'
import { useEffect, useState } from 'react'
import { AssignmentIn, AssignmentType, AssignmentTypes, ExamType } from '../../types'
import { AssignmentTabs } from './AssignmentTabs'
import { AssignmentCard } from './AssignmentCard'
import {
  AssignmentKeyTranslationEnglish,
  AssignmentKeyTranslationFinnish,
  getSingularAssignmentFinnish
} from './assignmentUtils'
import { useFetch } from '../useFetch'

function useActiveTabAndUrlPathUpdate({
  assignmentType,
  examType
}: {
  assignmentType: AssignmentType
  examType: ExamType
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AssignmentType>(assignmentType)

  useEffect(() => {
    if (activeTab) {
      navigate(`/${contentKey}/${examType}/${AssignmentKeyTranslationEnglish[activeTab]}`, { replace: true })
    }
  }, [activeTab, navigate, examType])

  return { activeTab, setActiveTab }
}

export const Assignments = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { assignmentType: assignmentParam, examType: examParam } = useParams()
  const { data: assignments, loading, error } = useFetch<AssignmentIn[]>(`assignment/${examParam!.toLocaleUpperCase()}`)

  const defaulAssignmentType = AssignmentKeyTranslationFinnish[assignmentParam!] as AssignmentType

  const { activeTab, setActiveTab } = useActiveTabAndUrlPathUpdate({
    assignmentType: defaulAssignmentType || AssignmentTypes.KOETEHTAVAT,
    examType: examParam as ExamType
  })

  const singularActiveTab = getSingularAssignmentFinnish(activeTab)

  return (
    <div className="pt-3">
      <h2 data-testid={`page-heading-${contentKey}-${examParam}`}>{navigationPages[examParam as string].title}</h2>

      <AssignmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div role="tabpanel">
        <div className="my-5">
          <Button
            variant="buttonPrimary"
            onClick={() => navigate(`${location.pathname}/${createKey}`)}
            data-testid={`create-${singularActiveTab}-button`}>
            + Lisää {singularActiveTab}
          </Button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}
        {assignments && assignments.length > 0 && (
          <ul>
            {assignments.map((assignment, i) => (
              <AssignmentCard assignment={assignment} key={i} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
