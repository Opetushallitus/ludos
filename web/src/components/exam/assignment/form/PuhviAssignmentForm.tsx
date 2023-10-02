import { FieldLabel } from '../../../FieldLabel'
import { getSelectedOptions, sortKooditAlphabetically } from '../../../../koodistoUtils'
import { FormProvider } from 'react-hook-form'
import { MultiSelectDropdown } from '../../../MultiSelectDropdown'
import { PuhviAssignmentFormType } from './assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, ContentType, Exam } from '../../../../types'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../../formCommon/AssignmentFileTypeRadio'
import { FormError } from '../../formCommon/FormErrors'
import { FormHeader } from '../../formCommon/FormHeader'
import { useAssignmentForm } from '../useAssignmentForm'
import { FormContentInput } from '../../formCommon/FormContentInput'

type PuhviAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const PuhviAssignmentForm = ({ action, id }: PuhviAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const { methods, handleMultiselectOptionChange, AssignmentFormButtonRow } =
    useAssignmentForm<PuhviAssignmentFormType>(Exam.PUHVI, id)

  const {
    watch,
    control,
    formState: { errors }
  } = methods

  const currentNameFi = watch('nameFi')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')
  const watchPublishState = watch('publishState')

  const assignmentTypeKoodisto = koodistos.tehtavatyyppipuhvi
  const lukuvuosiKoodisto = koodistos.ludoslukuvuosi
  const laajaalainenOsaaminenKoodisto = koodistos.laajaalainenosaaminenlops2021

  return (
    <>
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkokoetehtava') : currentNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvauskoetehtava') : t('form.muokkauskuvaus')}
      />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" id="newAssignment" onSubmit={(e) => e.preventDefault()}>
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

          <FormContentInput />
        </form>
      </FormProvider>

      <AssignmentFormButtonRow publishState={watchPublishState} />
    </>
  )
}
