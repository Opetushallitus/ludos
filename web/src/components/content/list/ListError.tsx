import { Icon } from '../../Icon'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { ContentType } from '../../../types'

type ListErrorProps = { contentType: ContentType }

export const ListError = ({ contentType }: ListErrorProps) => {
  const { lt } = useLudosTranslation()

  return (
    <div className="flex justify-center w-full gap-2 text-red-primary">
      <Icon name="virheellinen" color="text-red-primary" />
      {lt.contentListErrorMessage[contentType]}
    </div>
  )
}
