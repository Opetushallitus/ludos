import { ContentType } from '../../types'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Icon } from '../Icon'
import { PageNotFound } from '../LudosRoutes'

type ListErrorProps = {
  contentType: ContentType
  error: string
}

export const ContentError = ({ contentType, error }: ListErrorProps) => {
  const { lt } = useLudosTranslation()

  if (error === '404') {
    return <PageNotFound />
  }

  return (
    <div className="flex justify-center w-full gap-2 text-red-primary mt-10">
      <Icon name="virheellinen" color="text-red-primary" />
      {lt.contentErrorMessage[contentType]}
    </div>
  )
}
