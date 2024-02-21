import { UseFormRegister } from 'react-hook-form'
import { ReactNode } from 'react'
import { FormError } from './forms/formCommon/FormErrors'

type TextInputProps = {
  id: string
  register: UseFormRegister<any>
  deps?: string[]
  error?: string
  required?: boolean
  children: ReactNode
}
export const TextInput = ({ id, register, deps, error, required, children }: TextInputProps) => (
  <div className="mt-6">
    <label className="font-semibold" htmlFor={id}>
      {children}
      {required && <span className="ml-1 text-green-primary">*</span>}
    </label>
    <input
      id={id}
      data-testid={id}
      type="text"
      className={`block w-full border ${!!error ? 'border-red-primary' : 'border-gray-border'} p-2.5`}
      {...register(id, { required, deps })}
    />

    <FormError error={error} name={id} />
  </div>
)
