import { InstructionIn } from '../../../types'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'

import { muokkausKey } from '../../routes/LudosRoutes'

type InstructionCardProps = {
  language: string
  instruction: InstructionIn
  exam: string
}

export const InstructionCard = ({ language, instruction }: InstructionCardProps) => {
  const { t } = useTranslation()
  const { isYllapitaja } = useUserDetails()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`instruction-${instruction.id.toString()}`}>
      <div className="text-center">
        <InternalLink
          className="text-sm font-semibold text-green-primary"
          to={`${instruction.id}`}
          data-testid="instruction-name">
          {(language === 'fi' ? instruction.nameFi : instruction.nameSv) || t('form.nimeton')}
        </InternalLink>
        {isYllapitaja && (
          <InternalLink
            className="p-0 ml-2"
            to={`${muokkausKey}/${instruction.id}`}
            data-testid={`instruction-${instruction.id.toString()}-edit`}>
            <Icon name="muokkaa" color="text-green-primary" />
          </InternalLink>
        )}
      </div>
      <p className="mb-2 mt-2 text-center text-xs">
        {language === 'fi' ? instruction.shortDescriptionFi : instruction.shortDescriptionSv}
      </p>
      <p className="mb-2 mt-2 text-center text-xs">{toLocaleDate(instruction.createdAt)}</p>
      {isYllapitaja && <StateTag state={instruction.publishState} />}
    </div>
  )
}
