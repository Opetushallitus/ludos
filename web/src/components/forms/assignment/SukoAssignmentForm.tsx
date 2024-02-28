import { FieldLabel } from '../../FieldLabel'
import { FormProvider } from 'react-hook-form'
import { SukoAssignmentFormType } from '../schemas/assignmentSchema'
import { useTranslation } from 'react-i18next'
import { ContentFormAction, Exam, Oppimaara } from '../../../types'
import { sortKooditByArvo, useKoodisto } from '../../../hooks/useKoodisto'
import { AssignmentTypeField } from '../formCommon/AssignmentTypeRadio'
import { FormContentInput } from '../formCommon/FormContentInput'
import { FormHeader } from '../formCommon/FormHeader'
import { useAssignmentForm } from '../../../hooks/useAssignmentForm'
import { LudosSelect } from '../../ludosSelect/LudosSelect'
import {
  currentKoodistoSelectOption,
  currentKoodistoSelectOptions,
  currentOppimaaraSelectOption,
  koodistoSelectOptions,
  oppimaaraSelectOptions
} from '../../ludosSelect/helpers'
import { useCallback } from 'react'
import { BlockNavigation } from '../../BlockNavigation'
import { AssignmentFormButtonRow } from './AssignmentFormButtonRow'
import { InfoBox } from '../../InfoBox'

type SukoAssignmentFormProps = {
  action: ContentFormAction
  id?: string
}

export const SukoAssignmentForm = ({ action, id }: SukoAssignmentFormProps) => {
  const { t } = useTranslation()
  const { koodistos, sortKooditAlphabetically, getKoodiLabel, getOppimaaraLabel } = useKoodisto()

  const {
    methods,
    handleMultiselectOptionChange,
    submitAssignment,
    isLoaded,
    submitError,
    defaultValueError,
    isDeleteModalOpen,
    setIsDeleteModalOpen
  } = useAssignmentForm<SukoAssignmentFormType>(Exam.SUKO, id, action)

  const {
    watch,
    control,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting }
  } = methods

  const currentNameFi = watch('nameFi')
  const currentOppimaara: Oppimaara = watch('oppimaara')
  const currentTavoitetaso = watch('tavoitetasoKoodiArvo')
  const currentAihe = watch('aiheKoodiArvos')
  const currentLaajaalainenOsaaminen = watch('laajaalainenOsaaminenKoodiArvos')
  const watchPublishState = watch('publishState')

  const allOppimaaras = useCallback(() => {
    return Object.values(koodistos.oppiaineetjaoppimaaratlops2021).flatMap((oppimaaraKoodi) => {
      const tarkenneOppimaaras =
        oppimaaraKoodi.tarkenteet?.map((tarkenne) => ({
          oppimaaraKoodiArvo: oppimaaraKoodi.koodiArvo,
          kielitarjontaKoodiArvo: tarkenne
        })) ?? []
      return [
        {
          oppimaaraKoodiArvo: oppimaaraKoodi.koodiArvo,
          kielitarjontaKoodiArvo: null
        },
        ...tarkenneOppimaaras
      ]
    })
  }, [koodistos.oppiaineetjaoppimaaratlops2021])

  if (defaultValueError) {
    return <InfoBox type="error" i18nKey={t('error.sisallon-lataaminen-epaonnistui')} />
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
            <FieldLabel id="oppimaara" name={t('form.oppimaara')} required />
            <LudosSelect
              name="oppimaara"
              options={oppimaaraSelectOptions(allOppimaaras(), getKoodiLabel)}
              value={currentOppimaaraSelectOption(currentOppimaara, getOppimaaraLabel)}
              onChange={(opt) => {
                if (!opt) {
                  return
                }
                const oppimaaraParts = opt.value.split('.')
                setValue('oppimaara.oppimaaraKoodiArvo', oppimaaraParts[0], { shouldDirty: true })
                setValue('oppimaara.kielitarjontaKoodiArvo', oppimaaraParts[1], { shouldDirty: true })
                clearErrors('oppimaara')
              }}
              isSearchable
              error={errors.oppimaara?.message}
            />
          </fieldset>

          <AssignmentTypeField
            control={control}
            name="assignmentTypeKoodiArvo"
            required
            options={sortKooditAlphabetically(Object.values(koodistos.tehtavatyyppisuko))}
            errorMessage={errors?.assignmentTypeKoodiArvo}
          />

          <fieldset className="mb-6">
            <FieldLabel id="tavoitetaso" name={t('form.tavoitetaso')} />
            <LudosSelect
              name="tavoitetaso"
              options={koodistoSelectOptions(sortKooditByArvo(koodistos.taitotaso))}
              value={currentKoodistoSelectOption(currentTavoitetaso, koodistos.taitotaso)}
              onChange={(opt) => {
                if (!opt) {
                  return
                }
                setValue('tavoitetasoKoodiArvo', opt.value, { shouldDirty: true })
              }}
              isSearchable
            />
          </fieldset>

          <fieldset className="mb-6">
            <FieldLabel id="aihe" name={t('form.aihe')} />
            <LudosSelect
              name="aihe"
              options={koodistoSelectOptions(sortKooditAlphabetically(Object.values(koodistos.aihesuko)))}
              value={currentKoodistoSelectOptions(currentAihe, koodistos.aihesuko)}
              onChange={(opt) => handleMultiselectOptionChange('aiheKoodiArvos', opt)}
              isMulti
              isSearchable
            />
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

          <FormContentInput formDataIsLoaded={isLoaded} />
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
