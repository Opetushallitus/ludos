import { useKoodisto } from '../../../../hooks/useKoodisto'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { InstructionDtoOut, isLdInstruction, isSukoOrPuhviInstruction, Language } from '../../../../types'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { Icon } from '../../../Icon'
import { InternalLink } from '../../../InternalLink'
import { muokkausKey } from '../../../LudosRoutes'
import { StateTag } from '../../../StateTag'

type InstructionCardProps = {
  teachingLanguage: Language
  instruction: InstructionDtoOut
}

export const InstructionCard = ({ teachingLanguage, instruction }: InstructionCardProps) => {
  const { t } = useLudosTranslation()
  const { isYllapitaja } = useUserDetails()
  const { getKoodiLabel } = useKoodisto(teachingLanguage)

  const nameText = (teachingLanguage === Language.FI ? instruction.nameFi : instruction.nameSv) || t('form.nimeton')

  const titleText = () => {
    if (isSukoOrPuhviInstruction(instruction)) {
      return nameText
    }

    if (isLdInstruction(instruction)) {
      return getKoodiLabel(instruction.aineKoodiArvo, 'ludoslukiodiplomiaine')
    }
  }

  const bodyText = () => {
    if (isSukoOrPuhviInstruction(instruction)) {
      return teachingLanguage === Language.FI ? instruction.shortDescriptionFi : instruction.shortDescriptionSv
    }

    if (isLdInstruction(instruction)) {
      return nameText
    }
  }

  const returnLocation = `${location.pathname}${location.search}${location.hash}`

  return (
    <li
      className="w-[17.5rem] min-h-[8rem] rounded-md border border-t-4 border-gray-light border-t-green-primary flex flex-col"
      data-testid={`instruction-${instruction.id.toString()}`}
    >
      <div className="text-center px-2 break-words flex-1">
        <InternalLink
          className="text-sm font-semibold text-green-primary"
          to={`${instruction.id}`}
          state={{ returnLocation }}
          data-testid="card-title"
        >
          {titleText()}
        </InternalLink>
        {isYllapitaja && (
          <InternalLink
            className="p-0 ml-2"
            to={`${muokkausKey}/${instruction.id}`}
            state={{ returnLocation }}
            data-testid={`instruction-${instruction.id.toString()}-edit`}
          >
            <Icon name="muokkaa" color="text-green-primary" />
          </InternalLink>
        )}
      </div>
      <p className="mb-2 mt-2 text-center text-xs" data-testid="card-body">
        {bodyText()}
      </p>
      <p className="mb-2 mt-2 text-center text-xs">{toLocaleDate(instruction.createdAt)}</p>
      {isYllapitaja && <StateTag state={instruction.publishState} />}
    </li>
  )
}
