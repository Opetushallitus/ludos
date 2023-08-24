import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { LdAssignmentFormType, ldAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContentTypeEng, Exam, LdAssignmentIn, PublishState } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { createAssignment, updateAssignment } from '../../../../request'
import { Dropdown } from '../../../Dropdown'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { useFetch } from '../../../../hooks/useFetch'

type LdAssignmentFormProps = {
  action: 'new' | 'update'
  pathname: string
  id?: string
}

export const LdAssignmentForm = ({ action, pathname, id }: LdAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()
  const exam = Exam.Ld

  const { data: assignment } = useFetch<LdAssignmentIn>(`assignment/${exam}/${id}`, action === 'new')

  const methods = useForm<LdAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(ldAssignmentSchema) })

  const {
    watch,
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
        exam
      })
    } else {
      setValue('exam', exam)
      setValue('laajaalainenOsaaminenKoodiArvos', [])
    }
  }, [assignment, exam, reset, setValue])

  async function submitAssignment({ publishState }: { publishState: PublishState }) {
    await handleSubmit(async (data: LdAssignmentFormType) => {
      const body = { ...data, publishState }

      try {
        let resultId: string
        // When updating we need to have the assignment
        if (action === 'update' && assignment) {
          resultId = await updateAssignment<LdAssignmentFormType>(assignment.id, body)
        } else {
          const { id } = await createAssignment<LdAssignmentFormType>(body)
          resultId = id
        }

        navigate(`/${exam}/assignments/${resultId}`)
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const handleMultiselectOptionChange = (fieldName: keyof LdAssignmentFormType, selectedOptions: KoodiDtoIn[]) => {
    setValue(
      fieldName,
      selectedOptions.map((it) => it.koodiArvo)
    )
    clearErrors(fieldName)
  }

  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')
  const currentAine = watch('aineKoodiArvo')

  const lukuvuosiKoodisto = sortKooditAlphabetically(koodistos.ludoslukuvuosi || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])
  const aineKoodisto = sortKooditAlphabetically(koodistos.ludoslukiodiplomiaine || [])

  return (
    <>
      <FormHeader action={action} contentType={ContentTypeEng.KOETEHTAVAT} name={assignment?.nameFi} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <input type="hidden" {...register('exam')} />

          <div className="mb-6">
            <FieldLabel id="aineKoodiArvo" name={t('form.aine')} required />
            <Dropdown
              id="aineKoodiArvo"
              selectedOption={aineKoodisto.find((it) => it.koodiArvo === currentAine)}
              options={aineKoodisto}
              onSelectedOptionsChange={(opt: string) => {
                setValue('aineKoodiArvo', opt)
                clearErrors('aineKoodiArvo')
              }}
              testId="aineKoodiArvo"
              requiredError={!!errors.aineKoodiArvo}
            />
            <FormError error={errors.aineKoodiArvo?.message} />
          </div>

          <div className="mb-6">
            <FieldLabel id="lukuvuosiKoodiArvos" name={t('form.lukuvuosi')} required />
            <MultiSelectDropdown
              id="lukuvuosiKoodiArvos"
              options={lukuvuosiKoodisto}
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
              options={laajaalainenOsaaminenKoodisto}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminenKoodiArvos"
              canReset
            />
          </div>

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
