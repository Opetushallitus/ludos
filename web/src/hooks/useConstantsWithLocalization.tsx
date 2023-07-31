import { KoodiDtoIn } from '../LudosContext.tsx'
import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon.tsx'

export function useConstantsWithLocalization() {
  const { t } = useTranslation()

  const LANGUAGE_OPTIONS: KoodiDtoIn[] = [
    { nimi: t('language.suomi'), koodiArvo: 'fi' },
    { nimi: t('language.ruotsi'), koodiArvo: 'sv' }
  ]

  const LANGUAGE_DROPDOWN = {
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

  const ICONS: { name: Icons; text: string }[] = [
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
    ICONS,
    LANGUAGE_DROPDOWN
  }
}
