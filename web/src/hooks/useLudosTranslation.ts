import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { ContentOrder, ContentType, Exam, PublishState, TeachingLanguage } from '../types'
import { KoodiDtoOut } from './useKoodisto'

export type LocaleDropdownOptions = Record<string, { name: string; testId?: string }>

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
    fi: { name: t('language.suomi'), testId: 'fi' },
    sv: { name: t('language.ruotsi'), testId: 'sv' },
    keys: { name: 'Näytä avaimet', testId: 'keys' }
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
  // Grouped translations for different content and exam types.
  // Motivation: no dynamic keys, so we know what keys are used
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
    contentErrorMessage: {
      [ContentType.koetehtavat]: t('error.koetehtavan-lataus-epaonnistui'),
      [ContentType.ohjeet]: t('error.ohjeen-lataus-epaonnistui'),
      [ContentType.todistukset]: t('error.todistuksen-lataus-epaonnistui')
    },
    contentListErrorMessage: {
      [ContentType.koetehtavat]: t('error.koetehtavien-lataus-epaonnistui'),
      [ContentType.ohjeet]: t('error.ohjeiden-lataus-epaonnistui'),
      [ContentType.todistukset]: t('error.todistusten-lataus-epaonnistui')
    },
    contentDeleteModalTitle: {
      [ContentType.koetehtavat]: t('form.assignment.delete-modal.title'),
      [ContentType.ohjeet]: t('form.instruction.delete-modal.title'),
      [ContentType.todistukset]: t('form.certificate.delete-modal.title')
    },
    contentDeleteModalText: {
      [ContentType.koetehtavat]: (tehtavanNimi: string) => t('form.assignment.delete-modal.text', { tehtavanNimi }),
      [ContentType.ohjeet]: (ohjeenNimi: string) => t('form.instruction.delete-modal.text', { ohjeenNimi }),
      [ContentType.todistukset]: (todistuksenNimi: string) =>
        t('form.certificate.delete-modal.text', { todistuksenNimi })
    },
    contentCreateSuccessNotification: {
      [ContentType.koetehtavat]: {
        [PublishState.Published]: t('form.notification.tehtavan-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.tehtavan-tallennus.luonnos-onnistui')
      },
      [ContentType.ohjeet]: {
        [PublishState.Published]: t('form.notification.ohjeen-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.ohjeen-tallennus.luonnos-onnistui')
      },
      [ContentType.todistukset]: {
        [PublishState.Published]: t('form.notification.todistuksen-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.todistuksen-tallennus.luonnos-onnistui')
      }
    },
    contentUpdateSuccessNotification: {
      [ContentType.koetehtavat]: {
        [PublishState.Published]: {
          [PublishState.Published]: t('form.notification.tehtavan-tallennus.onnistui'),
          [PublishState.Draft]: t('form.notification.tehtavan-tallennus.palautettu-luonnostilaan'),
          [PublishState.Deleted]: t('form.notification.tehtavan-poisto.onnistui')
        },
        [PublishState.Draft]: {
          [PublishState.Published]: t('form.notification.tehtavan-tallennus.julkaisu-onnistui'),
          [PublishState.Draft]: t('form.notification.tehtavan-tallennus.onnistui'),
          [PublishState.Deleted]: t('form.notification.tehtavan-poisto.onnistui')
        }
      },
      [ContentType.ohjeet]: {
        [PublishState.Published]: {
          [PublishState.Published]: t('form.notification.ohjeen-tallennus.onnistui'),
          [PublishState.Draft]: t('form.notification.ohjeen-tallennus.palautettu-luonnostilaan'),
          [PublishState.Deleted]: t('form.notification.ohjeen-poisto.onnistui')
        },
        [PublishState.Draft]: {
          [PublishState.Published]: t('form.notification.ohjeen-tallennus.julkaisu-onnistui'),
          [PublishState.Draft]: t('form.notification.ohjeen-tallennus.onnistui'),
          [PublishState.Deleted]: t('form.notification.ohjeen-poisto.onnistui')
        }
      },
      [ContentType.todistukset]: {
        [PublishState.Published]: {
          [PublishState.Published]: t('form.notification.todistuksen-tallennus.onnistui'),
          [PublishState.Draft]: t('form.notification.todistuksen-tallennus.palautettu-luonnostilaan'),
          [PublishState.Deleted]: t('form.notification.todistuksen-poisto.onnistui')
        },
        [PublishState.Draft]: {
          [PublishState.Published]: t('form.notification.todistuksen-tallennus.julkaisu-onnistui'),
          [PublishState.Draft]: t('form.notification.todistuksen-tallennus.onnistui'),
          [PublishState.Deleted]: t('form.notification.todistuksen-poisto.onnistui')
        }
      }
    },
    contentPageLanguageDropdownLabel: {
      [ContentType.koetehtavat]: t('filter.koetehtavat-kieli'),
      [ContentType.ohjeet]: t('filter.ohjeet-kieli'),
      [ContentType.todistukset]: t('filter.todistukset-kieli')
    },
    tiptapImageSizeOptions: {
      original: t('file.koko.alkuperainen'),
      large: t('file.koko.suuri'),
      small: t('file.koko.pieni')
    },
    tiptapImageAlignOptions: {
      left: t('file.asemointi.ei-mitaan'),
      center: t('file.asemointi.keskitetty')
    },
    formSubmitErrorNotificationMessage: {
      [ContentType.koetehtavat]: t('form.notification.tehtavan-tallennus.epaonnistui'),
      [ContentType.ohjeet]: t('form.notification.ohjeen-tallennus.epaonnistui'),
      [ContentType.todistukset]: t('form.notification.todistuksen-tallennus.epaonnistui')
    },
    formDeleteErrorNotificationMessage: {
      [ContentType.koetehtavat]: t('form.notification.tehtavan-poisto.epaonnistui'),
      [ContentType.ohjeet]: t('form.notification.ohjeen-poisto.epaonnistui'),
      [ContentType.todistukset]: t('form.notification.todistuksen-poisto.epaonnistui')
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
