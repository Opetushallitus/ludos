import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { PuhviAssignmentFormType, PuhviAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Exam, PublishState, PuhviAssignmentIn } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from './formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../request'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from './formCommon/AssignmentFileTypeRadio'
import { FormError } from './formCommon/FormErrors'
import { FormContentInput } from './formCommon/FormContentInput'

type PuhviAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: PuhviAssignmentIn
  pathname: string
  exam: Exam
}

export const PuhviAssignmentForm = ({ action, assignment, pathname, exam }: PuhviAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()

  const methods = useForm<PuhviAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(PuhviAssignmentSchema) })

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
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: PuhviAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<PuhviAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<PuhviAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
      } catch (e) {
        console.error(e)
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
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={assignmentTypeKoodisto}
            requiredError={!!errors.assignmentTypeKoodiArvo}
          />

          <div className="mb-6">
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
          </div>

          <div className="mb-6">
            <FieldLabel id="laajaalainenOsaaminenKoodiArvos" name={t('form.laaja-alainen_osaaminen')} />
            <MultiSelectDropdown
              id="laajaalainenOsaaminenKoodiArvos"
              options={sortKooditAlphabetically(laajaalainenOsaaminenKoodisto || [])}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminenKoodiArvos"
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
