import { Control, Controller, FieldError } from 'react-hook-form'
import { KoodiDtoOut } from '../../../hooks/useKoodisto'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { FormError } from './FormErrors'

interface AssignmentTypeFieldProps {
  control: Control<any>
  name: string
  required: boolean
  options: KoodiDtoOut[]
  errorMessage?: FieldError
}

export const AssignmentTypeField = ({ control, name, required, options, errorMessage }: AssignmentTypeFieldProps) => {
  const { t } = useLudosTranslation()
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
                <label htmlFor={type.koodiArvo} className={`${errorMessage ? 'text-red-primary' : ''}`}>
                  {type.nimi}
                </label>
              </fieldset>
            ))}
          </>
        )}
      />
      <FormError error={errorMessage?.message} name="assignmentTypeKoodiArvo" />
    </div>
  )
}
