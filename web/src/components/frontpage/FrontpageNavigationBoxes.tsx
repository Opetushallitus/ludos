import { AssignmentType, Page } from '../../types'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon'

export const NavigationBoxes = ({ exams, assignments }: { exams: Page[]; assignments: AssignmentType[] }) => {
  const navigate = useNavigate()

  return (
    <>
      {exams.map((examType, i) => (
        <div className="mt-6" key={i}>
          <h3 className="mb-3 text-base font-semibold">{examType.title}</h3>
          <div className="row flex-wrap gap-3 md:flex-nowrap" data-testid={`exam-type-${examType.path}`}>
            {assignments.map((option, i) => (
              <div
                className="boxBorder flex h-20 w-full cursor-pointer rounded-md"
                onClick={() => navigate(examType.path, { state: { assignmentType: option } })}
                data-testid={`nav-box-${option}`}
                key={i}>
                <span className="row my-auto ml-3 gap-2">
                  <Icon name={option} color="text-green-primary" />
                  <p className="capitalize text-green-primary">{option}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
