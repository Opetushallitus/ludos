import { ReactNode } from 'react'
import { UseFormRegister } from 'react-hook-form'

type TextAreaInputProps = {
  id: string
  register: UseFormRegister<any>
  required?: boolean
  children: ReactNode
}

export const TextAreaInput = ({ id, register, required, children }: TextAreaInputProps) => (
  <div className="mt-6">
    <label className="mb-2 font-semibold" htmlFor="content">
      {children}
    </label>
    <textarea
      id={id}
      className="block h-40 w-full border border-gray-secondary p-2.5"
      {...register(id, { required })}
    />
  </div>
)
