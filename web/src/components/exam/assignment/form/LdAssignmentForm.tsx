import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider, useForm } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { LdAssignmentFormType, LdAssignmentSchema } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../../LudosContext'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Exam, LdAssignmentIn, PublishState } from '../../../../types'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormButtonRow } from '../../formCommon/FormButtonRow'
import { postAssignment, updateAssignment } from '../../../../request'
import { Dropdown } from '../../../Dropdown'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'

type LdAssignmentFormProps = {
  action: 'new' | 'update'
  assignment?: LdAssignmentIn
  pathname: string
  exam: Exam
}

export const LdAssignmentForm = ({ action, assignment, pathname, exam }: LdAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fi')

  const methods = useForm<LdAssignmentFormType>({ mode: 'onBlur', resolver: zodResolver(LdAssignmentSchema) })

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
          resultId = await updateAssignment<LdAssignmentFormType>(exam, assignment.id, body)
        } else {
          const { id } = await postAssignment<LdAssignmentFormType>(body)
          resultId = id
        }

        navigate(`${pathname}/../${resultId}`)
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
