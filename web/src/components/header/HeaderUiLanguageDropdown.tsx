import { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useUserDetails } from '../../hooks/useUserDetails'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../ludosSelect/helpers'
import { LudosSelect } from '../ludosSelect/LudosSelect'

export const HeaderUiLanguageDropdown = () => {
  const { uiLanguage, setUiLanguage } = useContext(LudosContext)
  const { isYllapitaja } = useUserDetails()

  return <UiLanguageDropdown value={uiLanguage} onChange={setUiLanguage} showKeysOption={isYllapitaja} />
}

type UiLanguageDropdownProps = {
  value: string
  onChange: (language: string) => void
  showKeysOption?: boolean
}

export const UiLanguageDropdown = ({ value, onChange, showKeysOption = false }: UiLanguageDropdownProps) => {
  const { LANGUAGE_DROPDOWN } = useLudosTranslation()

  // filter out keys option if not YLLAPITAJA
  const { keys, ...languageDropdownOptionsWithoutShowKeys } = LANGUAGE_DROPDOWN
  const languageDropdownOptions = showKeysOption ? LANGUAGE_DROPDOWN : languageDropdownOptionsWithoutShowKeys

  return (
    <LudosSelect
      name="languageDropdown"
      options={koodistoSelectOptions(Object.values(languageDropdownOptions))}
      value={currentKoodistoSelectOption(value, languageDropdownOptions)}
      onChange={(opt) => onChange(opt!.value)}
      className="w-auto h-[2.5rem]"
      transparentSelect
    />
  )
}
