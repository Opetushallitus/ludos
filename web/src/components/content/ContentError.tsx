import { ContentType } from '../../types'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Icon } from '../Icon'

type ListErrorProps = { contentType: ContentType }

export const ContentError = ({ contentType }: ListErrorProps) => {
  const { lt } = useLudosTranslation()

  return (
    <div className="flex justify-center w-full gap-2 text-red-primary mt-10">
      <Icon name="virheellinen" color="text-red-primary" />
      {lt.contentErrorMessage[contentType]}
    </div>
  )
}
