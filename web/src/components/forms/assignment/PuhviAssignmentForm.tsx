import { FieldLabel } from '../../FieldLabel'
import { FormProvider } from 'react-hook-form'
import { PuhviAssignmentFormType } from '../schemas/assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, Exam } from '../../../types'
import { sortKooditAlphabetically, useKoodisto } from '../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../formCommon/AssignmentTypeRadio'
import { FormHeader } from '../formCommon/FormHeader'
import { useAssignmentForm } from '../../../hooks/useAssignmentForm'
import { FormContentInput } from '../formCommon/FormContentInput'
import { LudosSelect } from '../../ludosSelect/LudosSelect'
import { currentKoodistoSelectOptions, koodistoSelectOptions } from '../../ludosSelect/helpers'
import { BlockNavigation } from '../../BlockNavigation'
import { AssignmentFormButtonRow } from './AssignmentFormButtonRow'
import { InfoBox } from '../../InfoBox'

type PuhviAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const PuhviAssignmentForm = ({ action, id }: PuhviAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos } = useKoodisto()

  const {
    methods,
    handleMultiselectOptionChange,
    submitAssignment,
    submitError,
    defaultValueError,
    isDeleteModalOpen,
    setIsDeleteModalOpen
  } = useAssignmentForm<PuhviAssignmentFormType>(Exam.PUHVI, id, action)

  const {
    watch,
    control,
    formState: { errors, isSubmitting }
  } = methods

  const currentNameFi = watch('nameFi')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const currentLukuvuosi = watch('lukuvuosiKoodiArvos')
  const watchPublishState = watch('publishState')
  const lukuvuosiKoodiArvosErrorMsg = errors.lukuvuosiKoodiArvos?.message as string

  if (defaultValueError) {
    return <InfoBox type="error" i18nKey="error.sisallon-lataaminen-epaonnistui" />
  }

  return (
    <>
      <FormHeader
        heading={action === ContentFormAction.uusi ? t('form.otsikkokoetehtava') : currentNameFi}
        description={action === ContentFormAction.uusi ? t('form.kuvauskoetehtava') : t('form.muokkauskuvaus')}
      />
      <BlockNavigation shouldBlock={methods.formState.isDirty && !isSubmitting} />
      <FormProvider {...methods}>
        <form className="border-y-2 border-gray-light py-5" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="mb-6">
            <FieldLabel id="lukuvuosiKoodiArvos" name={t('form.lukuvuosi')} required />
            <LudosSelect
              name="lukuvuosiKoodiArvos"
              options={koodistoSelectOptions(sortKooditAlphabetically(Object.values(koodistos.ludoslukuvuosi)))}
              value={currentKoodistoSelectOptions(currentLukuvuosi, koodistos.ludoslukuvuosi)}
              onChange={(opt) => handleMultiselectOptionChange('lukuvuosiKoodiArvos', opt)}
              isMulti
              isSearchable
              error={lukuvuosiKoodiArvosErrorMsg}
            />
          </fieldset>

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={sortKooditAlphabetically(Object.values(koodistos.tehtavatyyppipuhvi))}
            errorMessage={errors?.assignmentTypeKoodiArvo}
          />

          <fieldset className="mb-6">
            <FieldLabel id="laajaalainenOsaaminenKoodiArvos" name={t('form.laaja-alainen_osaaminen')} />
            <LudosSelect
              name="laajaalainenOsaaminenKoodiArvos"
              options={koodistoSelectOptions(
                sortKooditAlphabetically(Object.values(koodistos.laajaalainenosaaminenlops2021))
              )}
              value={currentKoodistoSelectOptions(
                currentLaajaalainenOsaaminen,
                koodistos.laajaalainenosaaminenlops2021
              )}
              onChange={(opt) => handleMultiselectOptionChange('laajaalainenOsaaminenKoodiArvos', opt)}
              isMulti
              isSearchable
            />
          </fieldset>

          <FormContentInput />
        </form>
      </FormProvider>

      <AssignmentFormButtonRow
        methods={methods}
        submitAssignment={submitAssignment}
        isUpdate={action === ContentFormAction.muokkaus}
        deleteModalState={{
          isDeleteModalOpen,
          setIsDeleteModalOpen
        }}
        publishState={watchPublishState}
        submitError={submitError}
      />
    </>
  )
}
