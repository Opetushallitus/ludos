import { Button } from '../Button'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { assignmentsKey, createKey } from '../routes/routes'
import { useAssignments } from './useGetAssignments'

export const Assignments = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { assignments } = useAssignments('SUKO')

  return (
    <div className="pt-3">
      <h2 className="text-2xl font-semibold">Koetehtävät</h2>
      <p className="py-2 text-base">
        Suullisen kielitaidon, äidinkielen puheviestinnän ja lukiodiplomien koetehtävät. Voit muokata tehtäviä ja luoda
        uusia.
      </p>
      <div className="my-5">
        <Button
          variant="buttonPrimary"
          onClick={() => navigate(`${location.pathname}${createKey}`)}
          data-testid={'create-assignment-button'}>
          + Lisää koetehtävä
        </Button>
      </div>
      {assignments && assignments.length > 0 && (
        <ul>
          {assignments.map((assignment, i) => (
            <li className="mb-3 rounded border-2 border-gray-light hover:text-green-primary" key={i}>
              <Link to={`${assignmentsKey}/${assignment.id}`}>{assignment.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
