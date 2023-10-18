import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { LocaleDropdownOptions } from '../components/header/HeaderDesktop'
import { ContentOrder, ContentType, Exam, TeachingLanguage } from '../types'
import { KoodiDtoOut } from './useKoodisto'

export type ContentAction = {
  actionName: string
  iconName: Icons
  text: string
  link?: string
}

export const useLudosTranslation = () => {
  const translation = useTranslation()
  const { t } = translation

  const LANGUAGE_OPTIONS: Record<TeachingLanguage, KoodiDtoOut> = {
    fi: { nimi: t('language.suomi'), koodiArvo: 'fi' },
    sv: { nimi: t('language.ruotsi'), koodiArvo: 'sv' }
  }

  const LANGUAGE_DROPDOWN: LocaleDropdownOptions = {
    fi: { name: t('language.suomi') },
    sv: { name: t('language.ruotsi') },
    keys: { name: 'Näytä avaimet' }
  }

  const ORDER_OPTIONS: Record<ContentOrder, KoodiDtoOut> = {
    asc: {
      koodiArvo: 'asc',
      nimi: t('filter.nouseva')
    },
    desc: {
      koodiArvo: 'desc',
      nimi: t('filter.laskeva')
    }
  }
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
    contentListErrorMessage: {
      [ContentType.koetehtavat]: t('error.koetehtavien-lataus-epaonnistui'),
      [ContentType.ohjeet]: t('error.ohjeiden-lataus-epaonnistui'),
      [ContentType.todistukset]: t('error.todistusten-lataus-epaonnistui')
    }
  }

  return {
    LANGUAGE_OPTIONS,
    ORDER_OPTIONS,
    LANGUAGE_DROPDOWN,
    lt,
    ...translation
  }
}
