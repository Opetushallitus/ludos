import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AssignmentIn } from '../../types'
import { StateTag } from '../StateTag'
import { Button } from '../Button'
import { sukoKey } from '../routes/routes'

function useAssignment(id?: string) {
  const [assignment, setAssignment] = useState<AssignmentIn>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/assignment/${id}`, { method: 'GET' })

        if (!response.ok) {
          throw new Error('could not fetch tasks')
        }

        const json = await response.json()

        setAssignment(json)
      } catch (e) {
        setError('error')
        console.error('could not fetch tasks', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return {
    assignment,
    loading,
    error,
    refresh: () => setRefresh(!refresh)
  }
}

export const Assignment = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { assignment, loading, error } = useAssignment(id)

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>error</div>
  }

  return (
    <div className="row h-full">
      {assignment && (
        <>
          <div className="col w-9/12">
            <div className="row h-full pb-3">
              <div className="col w-10/12">
                <p className="pb-3">{new Date(assignment.createdAt).toLocaleDateString('fi-FI')}</p>
                <h2 className="pb-3" data-testid="assignment-header">
                  {assignment.name}
                </h2>
                <div className="row gap-3">
                  <StateTag state={assignment.state} />
                  <p>Muokkaa</p>
                </div>
                <p className="pb-3">{assignment.content}</p>
              </div>
              <div className="col w-2/12">
                <p>Tehtävän kieli</p>
              </div>
            </div>
            <div className="row mb-6">
              <Button variant="buttonPrimary" onClick={() => navigate(`${sukoKey}`)}>
                Palaa koetehtäviin
              </Button>
            </div>
          </div>
          <div className="col w-3/12">
            <p>Muita tehtäviä</p>
          </div>
        </>
      )}
    </div>
  )
}
