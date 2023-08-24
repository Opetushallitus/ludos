import { ReactNode } from 'react'
import { UseFormRegister } from 'react-hook-form'

type TextAreaInputProps = {
  id: string
  register: UseFormRegister<any>
  error?: boolean
  required?: boolean
  children: ReactNode
}

export const TextAreaInput = ({ id, register, error, required, children }: TextAreaInputProps) => (
  <div className="mt-6">
    <label className="mb-2 font-semibold" htmlFor={id}>
      {children}
    </label>
    <textarea
      id={id}
      data-testid={id}
      className={`block h-40 w-full border ${error ? 'border-red-primary' : 'border-gray-secondary'} p-2.5`}
      {...register(id, { required })}
    />
  </div>
)
