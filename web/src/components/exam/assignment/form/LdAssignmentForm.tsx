import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { LdAssignmentFormType } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, ContentType, Exam } from '../../../../types'
import { Dropdown } from '../../../Dropdown'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { FormError } from '../../formCommon/FormErrors'
import { FormContentInput } from '../../formCommon/FormContentInput'
import { FormHeader } from '../../formCommon/FormHeader'
import { useAssignmentForm } from '../useAssignmentForm'

type LdAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const LdAssignmentForm = ({ action, id }: LdAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const { methods, handleMultiselectOptionChange, AssignmentFormButtonRow } = useAssignmentForm<LdAssignmentFormType>(
    Exam.LD,
    id
  )
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = methods

  const currentNameFi = watch('nameFi')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')
  const currentAine = watch('aineKoodiArvo')
  const watchPublishState = watch('publishState')

  const lukuvuosiKoodisto = sortKooditAlphabetically(koodistos.ludoslukuvuosi || [])
  const laajaalainenOsaaminenKoodisto = sortKooditAlphabetically(koodistos.laajaalainenosaaminenlops2021 || [])
  const aineKoodisto = sortKooditAlphabetically(koodistos.ludoslukiodiplomiaine || [])

  return (
    <>
      <FormHeader action={action} contentType={ContentType.koetehtavat} name={currentNameFi} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="mb-6">
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
          </fieldset>

          <fieldset className="mb-6">
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
          </fieldset>

          <fieldset className="mb-6">
            <FieldLabel id="laajaalainenOsaaminenKoodiArvos" name={t('form.laaja-alainen_osaaminen')} />
            <MultiSelectDropdown
              id="laajaalainenOsaaminenKoodiArvos"
              options={laajaalainenOsaaminenKoodisto}
              selectedOptions={getSelectedOptions(currentLaajaalainenOsaaminen, laajaalainenOsaaminenKoodisto || [])}
              onSelectedOptionsChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              testId="laajaalainenOsaaminenKoodiArvos"
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
