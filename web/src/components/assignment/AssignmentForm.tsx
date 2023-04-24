import { Controller, useForm } from 'react-hook-form'
import { Button } from '../Button'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AssignmentIn, AssignmentState, Exam } from '../../types'
import { contentKey } from '../routes/routes'
import { useTranslation } from 'react-i18next'
import { postAssignment, updateAssignment } from '../formUtils'
import { useEffect } from 'react'

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

export const AssignmentForm = ({ header, action }: { header: string; action: 'new' | 'update' }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/${contentKey}/:exam/:examType/${action}`)

  const exam = match!.params.exam as Exam
  const assignment = (state?.assignment as AssignmentIn) || null

  const {
    register,
    reset,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<SukoAssignmentForm>({ mode: 'onBlur', resolver: zodResolver(schema) })

  // set initial values when updating
  useEffect(() => {
    if (assignment) {
      reset(assignment)
    }
  }, [assignment, reset])

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: SukoAssignmentForm) => {
      const body = JSON.stringify({ ...data, state, examType: exam.toUpperCase() })

      try {
        let resultId: string

        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<string>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<{ id: string }>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  return (
    <div className="w-10/12 pt-3">
      <div className="mb-6">
        <h2 className="mb-3" data-testid="heading">
          {header}
        </h2>
        <p>{t('form.kuvaus')}</p>
      </div>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <div className="mb-6">
          <label className="mb-2 font-semibold" htmlFor="name">
            {t('form.tehtavannimi')}
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
            rules={{ required: true }}
            render={({ field }) => (
              <>
                {assignmentTypes.map((assignmentType, i) => {
                  return (
                    <fieldset key={i} className="flex items-center">
                      <input
                        type="radio"
                        {...field}
                        value={assignmentType.id}
                        checked={field.value === assignmentType.id}
                        id={assignmentType.id}
                        className="mr-2"
                      />
                      <label htmlFor={assignmentType.id}>{assignmentType.label}</label>
                    </fieldset>
                  )
                })}
              </>
            )}
          />
          {errors?.assignmentType && <p className="text-green-primary">{errors.assignmentType.message}</p>}
        </div>

        <div className="mb-6">
          <label className="mb-2 font-semibold" htmlFor="content">
            {t('form.tehtavansisalto')}
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
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Draft })}
          testId="form-draft">
          {t('button.tallennaluonnos')}
        </Button>
        <Button
          variant="buttonPrimary"
          type="button"
          onClick={() => submitAssignment({ state: AssignmentState.Published })}
          testId="form-submit">
          {t('button.tallennajulkaise')}
        </Button>
      </div>
    </div>
  )
}
