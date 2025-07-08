import { useContext } from 'react'
import { SingleValue } from 'react-select'
import { LudosContext } from '../contexts/LudosContext'
import { parseLanguage, useFilterValues } from '../hooks/useFilterValues'
import { sortKooditByArvo } from '../hooks/useKoodisto'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { Exam } from '../types'
import { currentKoodistoSelectOption, koodistoSelectOptions } from './ludosSelect/helpers'
import { LudosSelect, LudosSelectOption } from './ludosSelect/LudosSelect'

export const TeachingLanguageSelect = ({ exam }: { exam: Exam }) => {
  const { teachingLanguage, setTeachingLanguage } = useContext(LudosContext)
  const { setFilterValue } = useFilterValues(exam)
  const { LANGUAGE_OPTIONS } = useLudosTranslation()

  function onChange(opt: SingleValue<LudosSelectOption>) {
    const lang = parseLanguage(opt?.value || '')
    if (!lang) {
      return
    }
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

export function TeachingLanguageSelectWithLabel({
  exam,
  text,
  displaySuko = false
}: {
  exam: Exam
  text: string
  displaySuko?: boolean
}) {
  if (!displaySuko && exam === Exam.SUKO) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <p className="mt-2">{text}</p>
      <TeachingLanguageSelect exam={exam} />
    </div>
  )
}
