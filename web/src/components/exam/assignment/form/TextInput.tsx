import { UseFormRegister } from 'react-hook-form'
import { ReactNode } from 'react'

type TextInputProps = {
  id: string
  register: UseFormRegister<any>
  required?: boolean
  children: ReactNode
}
export const TextInput = ({ id, register, required, children }: TextInputProps) => (
  <div className="mt-6">
    <label className="font-semibold" htmlFor={id}>
      {children}
    </label>
    <input
      id={id}
      type="text"
      className="block w-full border border-gray-secondary p-2.5"
      {...register(id, { required })}
    />
  </div>
)
