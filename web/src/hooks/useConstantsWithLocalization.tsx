import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { LocaleDropdownOptions } from '../components/header/HeaderDesktop'

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

  const CONTENT_ACTIONS: { name: Icons; text: string }[] = [
    {
      name: 'uusi-valilehti',
      text: t('assignment.katselunakyma')
    },
    {
      name: 'todistukset',
      text: t('assignment.lataapdf')
    },
    {
      name: 'lisää',
      text: t('assignment.lisaalatauskoriin')
    }
  ]

  return {
    LANGUAGE_OPTIONS,
    SUKO_ASSIGNMENT_ORDER_OPTIONS,
    CONTENT_ACTIONS,
    LANGUAGE_DROPDOWN
  }
}
