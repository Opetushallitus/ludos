import { Control, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormError } from './FormErrors'
import { ErrorMessages } from '../../../types'
import { KoodiDtoOut } from '../../../hooks/useKoodisto'

interface AssignmentTypeFieldProps {
  control: Control<any>
  name: string
  required: boolean
  options: KoodiDtoOut[]
  requiredError: boolean
}

export const AssignmentTypeField = ({ control, name, required, options, requiredError }: AssignmentTypeFieldProps) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6">
      <legend className="mb-2 font-semibold">{t('form.tehtavatyyppi')} *</legend>
      <Controller
        control={control}
        name={name}
        rules={{ required }}
        render={({ field }) => (
          <>
            {options.map((type, i) => (
              <fieldset key={i} className="flex items-center">
                <input
                  type="radio"
                  {...field}
                  value={type.koodiArvo}
                  checked={field.value === type.koodiArvo}
                  id={type.koodiArvo}
                  data-testid={`assignmentTypeRadio-${type.koodiArvo.toLowerCase()}`}
                  className="mr-2 border-2 border-green-primary"
                />
                <label htmlFor={type.koodiArvo} className={`${requiredError ? 'text-red-primary' : ''}`}>
                  {type.nimi}
                </label>
              </fieldset>
            ))}
          </>
        )}
      />
      <FormError error={requiredError ? ErrorMessages.REQUIRED : undefined} />
    </div>
  )
}
