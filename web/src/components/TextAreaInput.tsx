import { ReactNode } from 'react'
import { UseFormRegister } from 'react-hook-form'
import { FormError } from './forms/formCommon/FormErrors'

type TextAreaInputProps = {
  id: string
  register: UseFormRegister<any>
  error?: string
  required?: boolean
  children: ReactNode
}

export const TextAreaInput = ({ id, register, error, required, children }: TextAreaInputProps) => (
  <div className="mt-6">
    <label className="mb-2 font-semibold" htmlFor={id}>
      {children}
      {required && <span className="ml-1 text-green-primary">*</span>}
    </label>
    <textarea
      id={id}
      data-testid={id}
      className={`block h-40 w-full border ${error ? 'border-red-primary' : 'border-gray-border'} p-2.5`}
      {...register(id, { required })}
    />

    <FormError error={error} name={id} />
  </div>
)
