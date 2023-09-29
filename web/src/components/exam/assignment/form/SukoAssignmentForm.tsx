import { FieldLabel } from '../../../FieldLabel'
import { Dropdown } from '../../../Dropdown'
import { getSelectedOptions, sortKooditAlphabetically, sortKooditByArvo } from '../../../../koodistoUtils'
import { FormProvider } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { SukoAssignmentFormType } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, ContentType, Exam } from '../../../../types'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../../formCommon/AssignmentFileTypeRadio'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { useAssignmentForm } from '../useAssignmentForm'

type SukoAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const SukoAssignmentForm = ({ action, id }: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const { methods, handleMultiselectOptionChange, AssignmentFormButtonRow } = useAssignmentForm<SukoAssignmentFormType>(
    Exam.SUKO,
    id
  )

  const {
    watch,
    control,
    setValue,
    clearErrors,
    formState: { errors }
  } = methods
  console.log(errors)

  const currentNameFi = watch('nameFi')
  const currentOppimaara = watch('oppimaaraKoodiArvo')
  const currentTavoitetaso = watch('tavoitetasoKoodiArvo')
  const currentAihe = watch('aiheKoodiArvos')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const watchPublishState = watch('publishState')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppisuko || []
  const oppimaaraKoodisto = sortKooditAlphabetically(koodistos.oppiaineetjaoppimaaratlops2021 || [])
  const tavoitetasoKoodisto = sortKooditByArvo(koodistos.taitotaso || [])
  const aiheKoodisto = sortKooditAlphabetically(koodistos.aihesuko || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])

  return (
    <>
      <FormHeader action={action} contentType={ContentType.koetehtavat} name={currentNameFi} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
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

          <FormContentInput />
        </form>
      </FormProvider>

      <AssignmentFormButtonRow publishState={watchPublishState} />
    </>
  )
}
