import { useNavigate, useParams } from 'react-router-dom'
import { StateTag } from '../StateTag'
import { Button } from '../Button'
import { contentKey, sukoKey } from '../routes/routes'
import { useFetch } from '../useFetch'
import { AssignmentIn } from '../../types'

export const Assignment = () => {
  const navigate = useNavigate()
  const params = useParams()

  const {
    data: assignment,
    loading,
    error
  } = useFetch<AssignmentIn>(`assignment/${params.exam!.toLocaleUpperCase()}/${params.id}`)

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
              <Button
                variant="buttonPrimary"
                onClick={() => navigate(`/${contentKey}/${sukoKey}`)}
                data-testid="return">
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
