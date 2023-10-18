import { InstructionDtoOut, TeachingLanguage } from '../../../../types'
import { InternalLink } from '../../../InternalLink'
import { StateTag } from '../../../StateTag'
import { Icon } from '../../../Icon'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'

import { muokkausKey } from '../../../LudosRoutes'

type InstructionCardProps = {
  teachingLanguage: TeachingLanguage
  instruction: InstructionDtoOut
  exam: string
}

export const InstructionCard = ({ teachingLanguage, instruction }: InstructionCardProps) => {
  const { t } = useTranslation()
  const { isYllapitaja } = useUserDetails()

  return (
    <div
      className="w-[17.5rem] min-h-[8rem] rounded-md border border-t-4 border-gray-light border-t-green-primary flex flex-col"
      data-testid={`instruction-${instruction.id.toString()}`}>
      <div className="text-center px-2 break-words flex-1">
        <InternalLink
          className="text-sm font-semibold text-green-primary"
          to={`${instruction.id}`}
          data-testid="instruction-name">
          {(teachingLanguage === TeachingLanguage.fi ? instruction.nameFi : instruction.nameSv) || t('form.nimeton')}
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
        {teachingLanguage === TeachingLanguage.fi ? instruction.shortDescriptionFi : instruction.shortDescriptionSv}
      </p>
      <p className="mb-2 mt-2 text-center text-xs">{toLocaleDate(instruction.createdAt)}</p>
      {isYllapitaja && <StateTag state={instruction.publishState} />}
    </div>
  )
}
