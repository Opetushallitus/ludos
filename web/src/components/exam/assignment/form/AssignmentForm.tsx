import { Controller, useForm } from 'react-hook-form'
import { Button } from '../../../Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AssignmentState, Exam, ExamType, SukoAssignmentIn } from '../../../../types'
import { contentKey } from '../../../routes/routes'
import { useTranslation } from 'react-i18next'
import { assignmentTypes, postAssignment, updateAssignment } from '../../../../formUtils'
import { useEffect, useState } from 'react'
import { SukoAssignmentForm, sukoSchema } from './sukoSchema'
import { Tabs } from '../../../Tabs'
import { TextAreaInput } from './TextAreaInput'
import { TextInput } from './TextInput'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/${contentKey}/:exam/:examType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const handleMultiSelectChange = (newSelectedOptions: string[]) => {
    setValue('topic', newSelectedOptions)
  }

  const exam = match!.params.exam as Exam
  const examType = match!.params.examType as ExamType

  const assignment = (state?.assignment as SukoAssignmentIn) || null

  const {
    watch,
    register,
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<SukoAssignmentForm>({ mode: 'onBlur', resolver: zodResolver(sukoSchema) })

  const topics = watch('topic') || []

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam: exam.toUpperCase() as Exam,
        examType: assignment.examType.toUpperCase() as SukoAssignmentForm['examType']
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
      setValue('examType', examType.toUpperCase() as SukoAssignmentForm['examType'])
    }
  }, [assignment, exam, examType, reset, setValue])

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: SukoAssignmentForm) => {
      const body = { ...data, state }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<string>(exam, assignment.id, body)
        } else {
          // const { id } = await postAssignment<{ id: string }>(body)
          // resultId = id
          console.log(body)
          resultId = '1'
        }

        //navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  return (
    <div className="w-10/12 pt-3">
      <div className="mb-6">
        <h2 className="mb-3" data-testid="heading">
          {action === 'new' ? t(`form.${exam}`) : assignment?.name}
        </h2>
        {action === 'new' ? <p>{t('form.kuvaus')}</p> : <p>{t('form.muokkauskuvaus')}</p>}
      </div>
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('examType')} />

        <MultiSelectDropdown
          options={[
            { key: '1', value: 'Option 1' },
            { key: '2', value: 'Option 2' },
            { key: '3', value: 'Option 3' }
          ]}
          selectedOptions={topics}
          onSelectedOptionsChange={handleMultiSelectChange}
          canReset
        />

        <div className="mb-6">
          <legend className="mb-2 font-semibold">{t('form.tehtavatyyppi')}</legend>
          <Controller
            control={control}
            name="assignmentType"
            rules={{ required: true }}
            render={({ field }) => (
              <>
                {assignmentTypes.map((assignmentType, i) => (
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
                ))}
              </>
            )}
          />
          {errors?.assignmentType && <p className="text-green-primary">{errors.assignmentType.message}</p>}
        </div>

        <div className="mb-2 text-lg font-semibold">Sisältö</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'fi' && (
          <>
            <TextInput id="name_fi" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.name_fi && <p className="text-green-primary">{errors.name_fi.message}</p>}
            <TextAreaInput id="content_fi" register={register}>
              {t('form.tehtavansisalto')}
            </TextAreaInput>
          </>
        )}
        {activeTab === 'sv' && (
          <>
            <TextInput id="name_sv" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.name_sv && <p className="text-green-primary">{errors.name_sv.message}</p>}
            <TextAreaInput id="content_sv" register={register}>
              {t('form.tehtavansisalto')}
            </TextAreaInput>
          </>
        )}
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
