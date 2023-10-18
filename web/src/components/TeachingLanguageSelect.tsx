import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { LudosSelect } from './ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from './ludosSelect/helpers'
import { sortKooditByArvo } from '../hooks/useKoodisto'
import { TeachingLanguage } from '../types'

export type TeachingLanguageSelectProps = {
  teachingLanguage: TeachingLanguage
  setTeachingLanguage: (opt: TeachingLanguage) => void
}

export const TeachingLanguageSelect = ({ teachingLanguage, setTeachingLanguage }: TeachingLanguageSelectProps) => {
  const { LANGUAGE_OPTIONS } = useLudosTranslation()

  return (
    <LudosSelect
      name="teachingLanguageDropdown"
      options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
      value={currentKoodistoSelectOption(teachingLanguage, LANGUAGE_OPTIONS)}
      onChange={(opt) => setTeachingLanguage(opt!.value as TeachingLanguage)}
      className="w-28"
    />
  )
}
