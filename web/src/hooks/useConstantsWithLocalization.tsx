import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { LocaleDropdownOptions } from '../components/header/HeaderDesktop'

export type ContentAction = {
  actionName: string
  iconName: Icons
  text: string
  link?: string
}

export const useConstantsWithLocalization = () => {
  const { t } = useTranslation()

  const LANGUAGE_OPTIONS: KoodiDtoIn[] = [
    { nimi: t('language.suomi'), koodiArvo: 'fi' },
    { nimi: t('language.ruotsi'), koodiArvo: 'sv' }
  ]

  const LANGUAGE_DROPDOWN: LocaleDropdownOptions = {
    fi: { name: t('language.suomi') },
    sv: { name: t('language.ruotsi') },
    keys: { name: 'Näytä avaimet' }
  }

  const SUKO_ASSIGNMENT_ORDER_OPTIONS: KoodiDtoIn[] = [
    {
      koodiArvo: 'asc',
      nimi: t('filter.nouseva')
    },
    {
      koodiArvo: 'desc',
      nimi: t('filter.laskeva')
    }
  ]

  return {
    LANGUAGE_OPTIONS,
    SUKO_ASSIGNMENT_ORDER_OPTIONS,
    LANGUAGE_DROPDOWN
  }
}
