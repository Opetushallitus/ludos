import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { LudosSelect } from './ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from './ludosSelect/helpers'
import { sortKooditByArvo } from '../hooks/useKoodisto'
import { Exam, Language } from '../types'
import { useContext } from 'react'
import { LudosContext } from '../contexts/LudosContext'
import { useFilterValues } from '../hooks/useFilterValues'

export const TeachingLanguageSelect = ({ exam }: { exam: Exam }) => {
  const { teachingLanguage, setTeachingLanguage } = useContext(LudosContext)
  const { setFilterValue } = useFilterValues(exam)
  const { LANGUAGE_OPTIONS } = useLudosTranslation()

  function onChange(opt: any) {
    const lang = opt!.value as Language
    setTeachingLanguage(lang)
    setFilterValue('kieli', lang)
  }

  return (
    <LudosSelect
      name="teachingLanguageDropdown"
      options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
      value={currentKoodistoSelectOption(teachingLanguage, LANGUAGE_OPTIONS)}
      onChange={onChange}
      className="w-32"
    />
  )
}

export function TeachingLanguageSelectWithLabel({ exam, text }: { exam: Exam; text: string }) {
  if (exam === Exam.SUKO) return null

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <p className="mt-2">{text}</p>
      <TeachingLanguageSelect exam={exam} />
    </div>
  )
}
