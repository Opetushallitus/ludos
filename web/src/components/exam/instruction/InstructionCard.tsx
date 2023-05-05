import { AssignmentIn } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'

type InstructionCardProps = {
  assignment: AssignmentIn
  exam: string
}

export const InstructionCard = ({ assignment }: InstructionCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`assignment-${assignment.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${assignment.id}`}>
          {assignment.nameFi}
        </InternalLink>
        <Icon
          name="muokkaa"
          color="text-green-primary"
          dataTestId={`assignment-${assignment.id.toString()}-edit`}
          onClick={() =>
            navigate('update', {
              state: {
                assignment
              }
            })
          }
          customClass="ml-2"
        />
      </div>
      <p className="mb-2 mt-2 text-center text-xs">{toLocaleDate(assignment.createdAt)}</p>
      <StateTag state={assignment.state} />
    </div>
  )
}
