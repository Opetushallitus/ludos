import { useFetch } from '../../hooks/useFetch'
import { AssignmentIn } from '../../types'
import { AssignmentCard } from './AssignmentCard'
import { FiltersType } from '../../hooks/useFilters'

export const AssignmentList = ({ url, filters }: { url: string; filters: FiltersType }) => {
  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  const { data, loading, error } = useFetch<AssignmentIn[]>(
    `${url}&${new URLSearchParams(removeNullsFromFilterObj).toString()}`
  )

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

// Removes key-value pairs with null or undefined values from an object
// src https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
function removeEmpty<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null))
}
