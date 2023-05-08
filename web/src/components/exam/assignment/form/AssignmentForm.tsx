import { Controller, useForm } from 'react-hook-form'
import { Button } from '../../../Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AssignmentState, Exam, ContentType, SukoAssignmentIn } from '../../../../types'
import { useTranslation } from 'react-i18next'
import { assignmentTypes, postAssignment, updateAssignment } from '../../../../formUtils'
import { useEffect, useState } from 'react'
import { AssignmentFormType, assignmentSchema } from './assignmentSchema'
import { Tabs } from '../../../Tabs'
import { TextAreaInput } from '../../../TextAreaInput'
import { TextInput } from '../../../TextInput'
import { ContentTypeTranslationFinnish } from '../assignmentUtils'
import { FormHeader } from '../../../formCommon/FormHeader'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const [activeTab, setActiveTab] = useState('fi')

  const exam = match!.params.exam as Exam
  const contentType = match!.params.contentType as ContentType

  const assignment = (state?.assignment as SukoAssignmentIn) || null

  const {
    register,
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<AssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(assignmentSchema) })

  // const handleMultiSelectChange = (newSelectedOptions: SelectOption[]) => {
  //   setValue(
  //     'topic',
  //     newSelectedOptions.map((option) => option.key)
  //   )
  // }
  // const topics = watch('topic') || []

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam: exam.toUpperCase() as Exam,
        contentType: assignment.contentType.toUpperCase() as AssignmentFormType['contentType']
      })
    } else {
      setValue('exam', exam.toUpperCase() as Exam)
      setValue('contentType', contentType.toUpperCase() as AssignmentFormType['contentType'])
    }
  }, [assignment, exam, contentType, reset, setValue])

  async function submitAssignment({ state }: { state: AssignmentState }) {
    await handleSubmit(async (data: AssignmentFormType) => {
      const body = { ...data, state }

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
      <FormHeader action={action} contentType={contentType} assignment={assignment} />
      <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
        <input type="hidden" {...register('exam')} />
        <input type="hidden" {...register('contentType')} />

        {/*<MultiSelectDropdown*/}
        {/*  options={TOPIC_OPTIONS}*/}
        {/*  selectedOptions={TOPIC_OPTIONS.filter((it) => topics.includes(it.key))}*/}
        {/*  onSelectedOptionsChange={handleMultiSelectChange}*/}
        {/*  canReset*/}
        {/*/>*/}

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
                      data-testid={`assignmentTypeRadio-${assignmentType.id.toLowerCase()}`}
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

        <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

        <div className="mb-6">
          <Tabs options={['fi', 'sv']} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'fi' && (
          <>
            <TextInput id="nameFi" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.nameFi && <p className="text-green-primary">{errors.nameFi.message}</p>}
            <TextAreaInput id="contentFi" register={register}>
              {t('form.tehtavansisalto')}
            </TextAreaInput>
          </>
        )}
        {activeTab === 'sv' && (
          <>
            <TextInput id="nameSv" register={register} required>
              {t('form.tehtavannimi')}
            </TextInput>
            {errors?.nameSv && <p className="text-green-primary">{errors.nameSv.message}</p>}
            <TextAreaInput id="contentSv" register={register}>
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
