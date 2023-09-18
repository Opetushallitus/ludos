import { InstructionIn } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { useTranslation } from 'react-i18next'
import { Button } from '../../Button'
import { muokkausKey } from '../../routes/routes'

type InstructionCardProps = {
  language: string
  instruction: InstructionIn
  exam: string
}

export const InstructionCard = ({ language, instruction }: InstructionCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isYllapitaja } = useUserDetails()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`instruction-${instruction.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${instruction.id}`}>
          {(language === 'fi' ? instruction.nameFi : instruction.nameSv) || t('form.nimeton')}
        </InternalLink>
        {isYllapitaja && (
          <Button
            variant="buttonGhost"
            customClass="p-0 ml-2"
            onClick={() => navigate(`${muokkausKey}/${instruction.id}`)}
            data-testid={`instruction-${instruction.id.toString()}-edit`}>
            <Icon name="muokkaa" color="text-green-primary" />
          </Button>
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
