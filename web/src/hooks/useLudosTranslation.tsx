import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { LocaleDropdownOptions } from '../components/header/HeaderDesktop'
import { ContentType, Exam } from '../types'

export type ContentAction = {
  actionName: string
  iconName: Icons
  text: string
  link?: string
}

export const useLudosTranslation = () => {
  const translation = useTranslation()

  const { t } = translation

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
  // grouped translations for different content and exam types
  const lt = {
    headingTextByExam: {
      [Exam.SUKO]: t('header.suko'),
      [Exam.LD]: t('header.ld'),
      [Exam.PUHVI]: t('header.puhvi')
    },
    buttonTextByContentType: {
      [ContentType.koetehtavat]: t('button.koetehtavat'),
      [ContentType.ohjeet]: t('button.ohjeet'),
      [ContentType.todistukset]: t('button.todistukset')
    },
    tabTextByContentType: {
      [ContentType.koetehtavat]: t('tab.koetehtavat'),
      [ContentType.ohjeet]: t('tab.ohjeet'),
      [ContentType.todistukset]: t('tab.todistukset')
    },
    tabTextByExam: {
      [Exam.SUKO]: t('tab.suko'),
      [Exam.LD]: t('tab.ld'),
      [Exam.PUHVI]: t('tab.puhvi')
    },
    returnTextByContentType: {
      [ContentType.koetehtavat]: t('assignment.palaa'),
      [ContentType.ohjeet]: t('instruction.palaa'),
      [ContentType.todistukset]: t('certificate.palaa')
    },
    addAssignmentTextByContentType: {
      [ContentType.koetehtavat]: t('button.lisaakoetehtava'),
      [ContentType.ohjeet]: t('button.lisaaohje'),
      [ContentType.todistukset]: t('button.lisaatodistus')
    }
  }

  return {
    LANGUAGE_OPTIONS,
    SUKO_ASSIGNMENT_ORDER_OPTIONS,
    LANGUAGE_DROPDOWN,
    lt,
    ...translation
  }
}
