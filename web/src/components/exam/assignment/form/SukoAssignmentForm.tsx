import { FieldLabel } from '../../../FieldLabel'
import { Dropdown } from '../../../Dropdown'
import { getSelectedOptions, sortKooditAlphabetically, sortKooditByArvo } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { SukoAssignmentFormType, sukoAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentTypeEng, Exam, PublishState, SukoAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { createAssignment, updateAssignment } from '../../../../request'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../../formCommon/AssignmentFileTypeRadio'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { useFetch } from '../../../../hooks/useFetch'

type SukoAssignmentFormProps = {
  action: 'new' | 'update'
  id?: string
}

export const SukoAssignmentForm = ({ action, id }: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const navigate = useNavigate()

  const exam = Exam.Suko

  const { data: assignment } = useFetch<SukoAssignmentIn>(`assignment/${exam}/${id}`, action === 'new')

  const methods = useForm<SukoAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(sukoAssignmentSchema) })

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const {
    watch,
    register,
    reset,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    formState: { errors }
  } = methods

  // set initial values
  useEffect(() => {
    if (assignment) {
      reset({
        ...assignment,
        exam
      })
    } else {
      setValue('exam', exam)
      setValue('aiheKoodiArvos', [])
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: SukoAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        setLoading(true)
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<SukoAssignmentFormType>(assignment.id, body)
        } else {
          const { id } = await createAssignment<SukoAssignmentFormType>(body)
          resultId = id
        }
        setSubmitError('')

        navigate(`/${exam}/assignments/${resultId}`)
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

  const handleMultiselectOptionChange = (fieldName: keyof SukoAssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
  }

  const currentOppimaara = watch('oppimaaraKoodiArvo')
  const currentTavoitetaso = watch('tavoitetasoKoodiArvo')
  const currentAihe = watch('aiheKoodiArvos')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppisuko || []
  const oppimaaraKoodisto = sortKooditAlphabetically(koodistos.oppiaineetjaoppimaaratlops2021 || [])
  const tavoitetasoKoodisto = sortKooditByArvo(koodistos.taitotaso || [])
  const aiheKoodisto = sortKooditAlphabetically(koodistos.aihesuko || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])

  return (
    <>
      <FormHeader action={action} contentType={ContentTypeEng.KOETEHTAVAT} name={assignment?.nameFi} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          <fieldset className="mb-6">
            <FieldLabel id="oppimaara" name={t('form.oppimaara')} required />
            <Dropdown
              id="oppimaara"
              selectedOption={oppimaaraKoodisto.find((it) => it.koodiArvo === currentOppimaara)}
              options={oppimaaraKoodisto}
              onSelectedOptionsChange={(opt: string) => {
                setValue('oppimaaraKoodiArvo', opt)
                clearErrors('oppimaaraKoodiArvo')
              }}
              testId="oppimaara"
              requiredError={!!errors.oppimaaraKoodiArvo}
            />
            <FormError error={errors.oppimaaraKoodiArvo?.message} />
          </fieldset>

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={assignmentTypeKoodisto}
            requiredError={!!errors.assignmentTypeKoodiArvo}
          />

          <fieldset className="mb-6">
            <FieldLabel id="tavoitetaso" name={t('form.tavoitetaso')} />
            <Dropdown
              id="tavoitetaso"
              selectedOption={
                tavoitetasoKoodisto && tavoitetasoKoodisto.find((it) => it.koodiArvo === currentTavoitetaso)
              }
              options={tavoitetasoKoodisto}
              onSelectedOptionsChange={(opt: string | null) => {
                setValue('tavoitetasoKoodiArvo', opt)
              }}
              canReset
              testId="tavoitetaso"
            />
            <FormError error={errors.tavoitetasoKoodiArvo?.message} />
          </fieldset>

          <fieldset className="mb-6">
            <FieldLabel id="aihe" name={t('form.aihe')} />
            <MultiSelectDropdown
              id="aihe"
              options={aiheKoodisto}
              selectedOptions={getSelectedOptions(currentAihe, aiheKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('aiheKoodiArvos', opt)}
              testId="aihe"
              canReset
            />
          </fieldset>

          <fieldset className="mb-6">
            <FieldLabel id="laajaalainenOsaaminen" name={t('form.laaja-alainen_osaaminen')} />
            <MultiSelectDropdown
              id="laajaalainenOsaaminen"
              options={laajaalainenOsaaminenKoodisto}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminen"
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
