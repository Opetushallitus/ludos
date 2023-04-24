import { AssignmentIn } from '../../types'
import { useFetch } from '../useFetch'
import { AssignmentCard } from './AssignmentCard'

export const AssignmentList = ({ url }: { url: string }) => {
  const { data, loading, error } = useFetch<AssignmentIn[]>(url)

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {data && data.length > 0 && (
        <ul>
          {data.map((assignment, i) => (
            <AssignmentCard assignment={assignment} key={i} />
          ))}
        </ul>
      )}
    </>
  )
}
