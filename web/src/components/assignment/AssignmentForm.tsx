import { Controller, useForm } from 'react-hook-form'
import { Button } from '../Button'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { AssignmentState } from '../../types'

const MIN_LENGTH = 3

const schema = z.object({
  name: z.string().min(MIN_LENGTH, { message: 'Too short' }),
  assignmentType: z.string({ required_error: 'Required' }),
  content: z.string().nullable()
})

type SukoAssignmentForm = z.infer<typeof schema>

const assignmentTypes = [
  {
    id: 'LUKEMINEN',
    label: 'Tekstin lukeminen'
  },
  {
    id: 'TEKSTIN_TIIVISTAMINEN',
    label: 'Tekstin tiivistäminen'
  },
  {
    id: 'KESKUSTELU',
    label: 'Ryhmäkeskustelu'
  }
]

type Response = {
  id: string
}

export const AssignmentForm = ({ header, description }: { header: string; description: string }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [_, examType, assignmentType] = location.pathname.split('/')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<SukoAssignmentForm>({ mode: 'onBlur', resolver: zodResolver(schema) })

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: SukoAssignmentForm) => {
      const body = JSON.stringify({ ...data, state, examType: examType.toUpperCase() })

      try {
        const result = await fetch('/api/assignment/', {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' }
        })

        if (!result.ok) {
          throw new Error()
        }

        const data: Response = await result.json()

        navigate(`/${examType}/${assignmentType}/${data.id}`)
      } catch (e) {
        console.error('WIRHE', e)
      }
    })()
  }

  return (
    <div className="w-10/12 pt-3">
      <div className="mb-6">
        <h2 className="mb-3" data-testid="heading">
          {header}
        </h2>
        <p>{description}</p>
      </div>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-6">
          <label className="mb-2 font-semibold" htmlFor="name">
            Tehtävän nimi
          </label>
          <input
            id="name"
            type="text"
            className="block w-full border border-gray-secondary p-2.5"
            {...register('name', { required: true })}
          />
          {errors?.name && <p className="text-green-primary">{errors.name.message}</p>}
        </div>
        <div className="mb-6">
          <legend className="mb-2 font-semibold">Tehtävätyyppi</legend>
          <Controller
            control={control}
            name="assignmentType"
            render={({ field }) => (
              <>
                {assignmentTypes.map((assignmentType, i) => (
                  <div className="w-10/12" key={i}>
                    <input
                      className="mr-2"
                      type="radio"
                      onChange={field.onChange}
                      value={assignmentType.id}
                      name="assignmentType"
                      id={assignmentType.id}
                    />
                    <label htmlFor={assignmentType.id}>{assignmentType.label}</label>
                  </div>
                ))}
              </>
            )}
          />
          {errors?.assignmentType && <p className="text-green-primary">{errors.assignmentType.message}</p>}
        </div>

        <div className="mb-6">
          <label className="mb-2 font-semibold" htmlFor="content">
            Tehtävän sisältö
          </label>
          <textarea
            id="content"
            className="block h-40 w-full border border-gray-secondary"
            {...register('content', {})}
          />
        </div>
      </form>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="buttonGhost" type="button" onClick={() => navigate(-1)} testId="form-cancel">
          Peruuta
        </Button>
        <Button
          variant="buttonSecondary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Draft })}
          testId="form-draft">
          Tallenna luonnos
        </Button>
        <Button
          variant="buttonPrimary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Published })}
          testId="form-submit">
          Tallenna ja julkaise
        </Button>
      </div>
    </div>
  )
}
