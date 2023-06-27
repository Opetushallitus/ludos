import { AssignmentIn } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'

type InstructionCardProps = {
  instruction: AssignmentIn
  exam: string
}

export const InstructionCard = ({ instruction }: InstructionCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`instruction-${instruction.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${instruction.id}`}>
          {instruction.nameFi}
        </InternalLink>
        <Icon
          name="muokkaa"
          color="text-green-primary"
          dataTestId={`instruction-${instruction.id.toString()}-edit`}
          onClick={() =>
            navigate('update', {
              state: {
                data: instruction
              }
            })
          }
          customClass="ml-2"
        />
      </div>
      <p className="mb-2 mt-2 text-center text-xs">{toLocaleDate(instruction.createdAt)}</p>
      <StateTag state={instruction.publishState} />
    </div>
  )
}
