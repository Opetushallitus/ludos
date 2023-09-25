import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { PuhviAssignmentFormType, puhviAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentFormAction, ContentType, Exam, PublishState, PuhviAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { createAssignment, updateAssignment } from '../../../../request'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../../formCommon/AssignmentFileTypeRadio'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { useFetch } from '../../../../hooks/useFetch'
import { contentListPath, contentPagePath } from '../../../routes/LudosRoutes'

type PuhviAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const PuhviAssignmentForm = ({ action, id }: PuhviAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()
  const exam = Exam.PUHVI

  const { data: assignment } = useFetch<PuhviAssignmentIn>(
    `assignment/${exam}/${id}`,
    action === ContentFormAction.uusi
  )

  const methods = useForm<PuhviAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(puhviAssignmentSchema) })

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const {
    watch,
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors }
  } = methods

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        lukuvuosiKoodiArvos: assignment.lukuvuosiKoodiArvos.length > 0 ? assignment.lukuvuosiKoodiArvos : undefined,
        exam
      })
    } else {
      setValue('exam', exam)
      setValue('laajaalainenOsaaminenKoodiArvos', [])
      setValue('contentFi', '')
      setValue('contentSv', '')
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: PuhviAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        setLoading(true)
        let resultId: number
        // When updating we need to have the assignment
        if (action === ContentFormAction.muokkaus && assignment) {
          resultId = await updateAssignment<PuhviAssignmentFormType>(assignment.id, body)
        } else {
          const { id } = await createAssignment<PuhviAssignmentFormType>(body)
          resultId = id
        }
        setSubmitError('')

        navigate(contentPagePath(exam, ContentType.koetehtavat, resultId), {
          state: { returnLocation: contentListPath(exam, ContentType.koetehtavat) }
        })
      } catch (e) {
        if (e instanceof Error) {
          setSubmitError(e.message || 'Unexpected error')
        }
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }

  const handleMultiselectOptionChange = (fieldName: keyof PuhviAssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
    clearErrors(fieldName)
  }

  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppipuhvi
  const lukuvuosiKoodisto = koodistos.ludoslukuvuosi
  const laajaalainenOsaaminenKoodisto = koodistos.laajaalainenosaaminenlops2021

  return (
    <>
      <FormHeader action={action} contentType={ContentType.koetehtavat} name={assignment?.nameFi} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          <fieldset className="mb-6">
            <FieldLabel id="lukuvuosiKoodiArvos" name={t('form.lukuvuosi')} required />
            <MultiSelectDropdown
              id="lukuvuosiKoodiArvos"
              options={sortKooditAlphabetically(lukuvuosiKoodisto || [])}
              selectedOptions={getSelectedOptions(currentLukuvuosi, lukuvuosiKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('lukuvuosiKoodiArvos', opt)}
              testId="lukuvuosiKoodiArvos"
              canReset
              requiredError={!!errors.lukuvuosiKoodiArvos}
            />
            <FormError error={errors.lukuvuosiKoodiArvos?.message} />
          </fieldset>

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={assignmentTypeKoodisto}
            requiredError={!!errors.assignmentTypeKoodiArvo}
          />

          <fieldset className="mb-6">
            <FieldLabel id="laajaalainenOsaaminenKoodiArvos" name={t('form.laaja-alainen_osaaminen')} />
            <MultiSelectDropdown
              id="laajaalainenOsaaminenKoodiArvos"
              options={sortKooditAlphabetically(laajaalainenOsaaminenKoodisto || [])}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminenKoodiArvos"
              canReset
            />
          </fieldset>

          <FormContentInput
            initialContent={{ fi: assignment?.contentFi ?? '', sv: assignment?.contentSv ?? '' }}
            hasInstruction
          />
        </form>
      </FormProvider>
      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
        errorMessage={submitError}
        isLoading={loading}
      />
    </>
  )
}
