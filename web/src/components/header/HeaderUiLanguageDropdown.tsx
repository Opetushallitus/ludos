import { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useUserDetails } from '../../hooks/useUserDetails'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../ludosSelect/helpers'
import { LudosSelect } from '../ludosSelect/LudosSelect'

export const HeaderUiLanguageDropdown = () => {
  const { uiLanguage, setUiLanguage } = useContext(LudosContext)
  const { LANGUAGE_DROPDOWN } = useLudosTranslation()
  const { isYllapitaja } = useUserDetails()

  // filter out keys option if not YLLAPITAJA
  const { keys, ...languageDropdownOptionsWithoutShowKeys } = LANGUAGE_DROPDOWN
  const languageDropdownOptions = isYllapitaja ? LANGUAGE_DROPDOWN : languageDropdownOptionsWithoutShowKeys

  return (
    <LudosSelect
      name="languageDropdown"
      options={koodistoSelectOptions(Object.values(languageDropdownOptions))}
      value={currentKoodistoSelectOption(uiLanguage, languageDropdownOptions)}
      onChange={(opt) => setUiLanguage(opt!.value)}
      className="w-auto h-[2.5rem]"
      transparentSelect
    />
  )
}
