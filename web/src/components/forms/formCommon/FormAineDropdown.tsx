import { FieldLabel } from '../../FieldLabel'
import { LudosSelect } from '../../ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../../ludosSelect/helpers'
import { sortKooditAlphabetically, useKoodisto } from '../../../hooks/useKoodisto'
import { FormError } from './FormErrors'
import { useFormContext } from 'react-hook-form'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

export const FormAineDropdown = () => {
  const { t } = useLudosTranslation()
  const { koodistos } = useKoodisto()
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = useFormContext()

  const currentAine = watch('aineKoodiArvo')
  const aineKoodiArvoError = errors.aineKoodiArvo?.message as string

  return (
    <fieldset className="mb-6">
      <FieldLabel id="aineKoodiArvo" name={t('form.aine')} required />
      <LudosSelect
        name="aineKoodiArvo"
        options={koodistoSelectOptions(sortKooditAlphabetically(Object.values(koodistos.ludoslukiodiplomiaine)))}
        value={currentKoodistoSelectOption(currentAine!, koodistos.ludoslukiodiplomiaine)}
        onChange={(opt) => {
          if (!opt) {
            return
          }
          setValue('aineKoodiArvo', opt.value, { shouldDirty: true })
          clearErrors('aineKoodiArvo')
        }}
        isSearchable
        error={!!errors.aineKoodiArvo}
      />
      <FormError error={aineKoodiArvoError} />
    </fieldset>
  )
}
