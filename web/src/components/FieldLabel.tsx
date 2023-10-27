type FieldInputProps = {
  id: string
  name: string
  required?: boolean
}
export const FieldLabel = ({ id, name, required, ...props }: FieldInputProps) => {
  return (
    <label className="mb-2 font-semibold" htmlFor={`${id}-input`} data-testid={`${id}-label`} {...props}>
      {name}
      {required && <span className="ml-1 text-green-primary">*</span>}
    </label>
  )
}
