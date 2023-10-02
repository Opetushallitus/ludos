type FormHeaderProps = {
  heading: string
  description: string
}

export const FormHeader = ({ heading, description }: FormHeaderProps) => (
  <div className="mb-6">
    <h2 className="mb-3" data-testid="heading">
      {heading}
    </h2>
    <p>{description}</p>
  </div>
)
