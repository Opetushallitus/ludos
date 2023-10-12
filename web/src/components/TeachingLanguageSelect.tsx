import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { LudosSelect } from './ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from './ludosSelect/helpers'
import { sortKooditByArvo } from '../hooks/useKoodisto'

export function TeachingLanguageSelect(props: { teachingLanguge: string; setTeachingLanguage: (opt: string) => void }) {
  const { LANGUAGE_OPTIONS } = useLudosTranslation()

  return (
    <LudosSelect
      name="teachingLanguageDropdown"
      options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
      value={currentKoodistoSelectOption(props.teachingLanguge, LANGUAGE_OPTIONS)}
      onChange={(opt) => props.setTeachingLanguage(opt!.value)}
      className="w-28"
    />
  )
}
