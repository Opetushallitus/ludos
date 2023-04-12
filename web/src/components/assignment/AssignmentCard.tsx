import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { AssignmentIn } from '../../types'
import { StateTag } from '../StateTag'

type AssignmentCardProps = {
  assignment: AssignmentIn
}

export const AssignmentCard = ({ assignment }: AssignmentCardProps) => {
  return (
    <li className="my-2 rounded-lg border-2 border-gray-light hover:text-green-primary">
      <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
        <Link className="text-lg font-semibold text-green-primary" to={`${assignment.id}`}>
          {assignment.name}
        </Link>
        <StateTag state={assignment.state} />
        <Icon name="muokkaa" color="text-green-primary" />
      </div>
      <div className="flex flex-wrap md:flex md:flex-row md:flex-nowrap">
        <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-6/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
          <div>
            <p className="text-sm text-gray-secondary">Oppimäärä</p>
            <p className="text-sm text-black">*oppimäärä*</p>
          </div>
          <div>
            <p className="text-sm text-gray-secondary">Tehtävätyyppi</p>
            <p className="text-sm text-black">{assignment.assignmentType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-secondary">Lisätty</p>
            <p className="text-sm text-black">{new Date(assignment.createdAt).toLocaleDateString('fi-FI')}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-evenly md:w-6/12 md:justify-end md:gap-3 md:p-3">
          <span className="flex items-center">
            <Icon name="uusi-valilehti" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">Katselunäkymä</p>
          </span>
          <span className="flex items-center">
            <Icon name="koetehtavat" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">Lataa pdf</p>
          </span>
          <span className="flex items-center">
            <Icon name="lisää" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">Latauskoriin</p>
          </span>
        </div>
      </div>
    </li>
  )
}
