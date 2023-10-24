import { FieldLabel } from '../FieldLabel'
import { FormProvider } from 'react-hook-form'
import { LdAssignmentFormType } from './schemas/assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, Exam } from '../../types'
import { sortKooditAlphabetically, useKoodisto } from '../../hooks/useKoodisto'
import { FormError } from './formCommon/FormErrors'
import { FormContentInput } from './formCommon/FormContentInput'
import { FormHeader } from './formCommon/FormHeader'
import { useAssignmentForm } from '../../hooks/useAssignmentForm'
import {
  currentKoodistoSelectOption,
  currentKoodistoSelectOptions,
  koodistoSelectOptions
} from '../ludosSelect/helpers'
import { LudosSelect } from '../ludosSelect/LudosSelect'

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
            <LudosSelect
              name="lukuvuosiKoodiArvos"
              options={koodistoSelectOptions(sortKooditAlphabetically(Object.values(koodistos.ludoslukuvuosi)))}
              value={currentKoodistoSelectOptions(currentLukuvuosi, koodistos.ludoslukuvuosi)}
              onChange={(opt) => handleMultiselectOptionChange('lukuvuosiKoodiArvos', opt)}
              isMulti
              isSearchable
              error={!!errors.lukuvuosiKoodiArvos}
            />
            <FormError error={errors.lukuvuosiKoodiArvos?.message} />
          </fieldset>

          <fieldset className="mb-6">
            <FieldLabel id="aineKoodiArvo" name={t('form.aine')} required />
            <LudosSelect
              name="aineKoodiArvo"
              options={koodistoSelectOptions(sortKooditAlphabetically(Object.values(koodistos.ludoslukiodiplomiaine)))}
              value={currentKoodistoSelectOption(currentAine, koodistos.ludoslukiodiplomiaine)}
              onChange={(opt) => {
                if (!opt) {
                  return
                }
                setValue('aineKoodiArvo', opt.value)
                clearErrors('aineKoodiArvo')
              }}
              isSearchable
              error={!!errors.aineKoodiArvo}
            />
            <FormError error={errors.aineKoodiArvo?.message} />
          </fieldset>

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

      <AssignmentFormButtonRow publishState={watchPublishState} />
    </>
  )
}
