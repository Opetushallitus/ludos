export const Spinner = () => {
  return (
    <div role="status">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-l-2 border-t-2 border-gray-primary"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
