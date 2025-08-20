import { useFormContext } from 'react-hook-form'
import { useKoodisto } from '../../../hooks/useKoodisto'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { FieldLabel } from '../../FieldLabel'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../../ludosSelect/helpers'
import { LudosSelect } from '../../ludosSelect/LudosSelect'

export const FormAineDropdown = () => {
  const { t } = useLudosTranslation()
  const { koodistos, sortKooditAlphabetically } = useKoodisto()
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
        error={aineKoodiArvoError}
      />
    </fieldset>
  )
}
