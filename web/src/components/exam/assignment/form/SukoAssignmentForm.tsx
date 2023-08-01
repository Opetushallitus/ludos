import { FieldLabel } from '../../../FieldLabel'
import { Dropdown } from '../../../Dropdown'
import { getSelectedOptions, sortKooditAlphabetically, sortKooditByArvo } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { SukoAssignmentFormType, sukoAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Exam, PublishState, SukoAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../request'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../../formCommon/AssignmentFileTypeRadio'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'

type SukoAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: SukoAssignmentIn
  pathname: string
}

export const SukoAssignmentForm = ({ action, assignment, pathname }: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const navigate = useNavigate()
  const exam = Exam.Suko

  const methods = useForm<SukoAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(sukoAssignmentSchema) })

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
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<SukoAssignmentFormType>(assignment.id, body)
        } else {
          const { id } = await postAssignment<SukoAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
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
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          <div className="mb-6">
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
          </div>

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={assignmentTypeKoodisto}
            requiredError={!!errors.assignmentTypeKoodiArvo}
          />

          <div className="mb-6">
            <FieldLabel id="tavoitetaso" name={t('form.tavoitetaso')} required />
            <Dropdown
              id="tavoitetaso"
              selectedOption={
                tavoitetasoKoodisto && tavoitetasoKoodisto.find((it) => it.koodiArvo === currentTavoitetaso)
              }
              options={tavoitetasoKoodisto}
              onSelectedOptionsChange={(opt: string) => {
                setValue('tavoitetasoKoodiArvo', opt)
                clearErrors('tavoitetasoKoodiArvo')
              }}
              testId="tavoitetaso"
              requiredError={!!errors.tavoitetasoKoodiArvo}
            />
            <FormError error={errors.tavoitetasoKoodiArvo?.message} />
          </div>

          <div className="mb-6">
            <FieldLabel id="aihe" name={t('form.aihe')} />
            <MultiSelectDropdown
              id="aihe"
              options={aiheKoodisto}
              selectedOptions={getSelectedOptions(currentAihe, aiheKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('aiheKoodiArvos', opt)}
              testId="aihe"
              canReset
            />
          </div>

          <div className="mb-6">
            <FieldLabel id="laajaalainenOsaaminen" name={t('form.laaja-alainen_osaaminen')} />
            <MultiSelectDropdown
              id="laajaalainenOsaamine"
              options={laajaalainenOsaaminenKoodisto}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminen"
              canReset
            />
          </div>

          <div className="mb-2 text-lg font-semibold">{t('form.sisalto')}</div>

          <FormContentInput hasInstruction />
        </form>
      </FormProvider>

      <FormButtonRow
        onCancelClick={() => navigate(-1)}
        onSaveDraftClick={() => submitAssignment({ publishState: PublishState.Draft })}
        onSubmitClick={() => submitAssignment({ publishState: PublishState.Published })}
      />
    </>
  )
}
