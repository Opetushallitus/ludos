export const Spinner = ({ ...props }) => (
  <div role="status" {...props}>
    <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-l-2 border-t-2 border-gray-primary"></div>
  </div>
)
