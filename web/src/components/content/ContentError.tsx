import { ContentType } from '../../types'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Icon } from '../Icon'
import { PageNotFound } from '../LudosRoutes'
import { NonOkResponseFetchError } from '../../request'

type ContentErrorProps = {
  contentType: ContentType
  error: Error
}

export const ContentError = ({ contentType, error }: ContentErrorProps) => {
  const { lt } = useLudosTranslation()

  if (error instanceof NonOkResponseFetchError && error.code === 404) {
    return <PageNotFound />
  }

  return (
    <div className="flex justify-center w-full gap-2 text-red-primary mt-10">
      <Icon name="virheellinen" color="text-red-primary" />
      {lt.contentErrorMessage[contentType]}
    </div>
  )
}
