import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { LudosSelect } from './ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from './ludosSelect/helpers'
import { sortKooditByArvo } from '../hooks/useKoodisto'
import { Language } from '../types'
import { useContext } from 'react'
import { LudosContext } from '../contexts/LudosContext'

export const TeachingLanguageSelect = () => {
  const { teachingLanguage, setTeachingLanguage } = useContext(LudosContext)
  const { LANGUAGE_OPTIONS } = useLudosTranslation()

  return (
    <LudosSelect
      name="teachingLanguageDropdown"
      options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
      value={currentKoodistoSelectOption(teachingLanguage, LANGUAGE_OPTIONS)}
      onChange={(opt) => setTeachingLanguage(opt!.value as Language)}
      className="w-32"
    />
  )
}
