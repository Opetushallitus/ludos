type FieldInputProps = {
  id: string
  name: string
  required?: boolean
}
export const FieldLabel = ({ id, name, required }: FieldInputProps) => {
  return (
    <label className="mb-2 font-semibold" htmlFor={id} data-testid={`${id}-label`}>
      {name}
      {required && <span className="ml-1 text-green-primary">*</span>}
    </label>
  )
}
