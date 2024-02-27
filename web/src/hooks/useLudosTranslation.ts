import { useTranslation } from 'react-i18next'
import { Icons } from '../components/Icon'
import { AddToFavoriteOptions, ContentOrder, ContentType, Exam, Language, PublishState } from '../types'
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

  const LANGUAGE_OPTIONS: Record<Language, KoodiDtoOut> = {
    FI: { nimi: t('language.suomi'), koodiArvo: 'FI' },
    SV: { nimi: t('language.ruotsi'), koodiArvo: 'SV' }
  }

  const LANGUAGE_DROPDOWN: Record<string, KoodiDtoOut> = {
    fi: { nimi: t('language.suomi'), koodiArvo: 'fi' },
    sv: { nimi: t('language.ruotsi'), koodiArvo: 'sv' },
    keys: { nimi: 'Näytä avaimet', koodiArvo: 'keys' }
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
      [ContentType.ASSIGNMENT]: t('button.koetehtavat'),
      [ContentType.INSTRUCTION]: t('button.ohjeet'),
      [ContentType.CERTIFICATE]: t('button.todistukset')
    },
    tabTextByContentType: {
      [ContentType.ASSIGNMENT]: t('tab.koetehtavat'),
      [ContentType.INSTRUCTION]: t('tab.ohjeet'),
      [ContentType.CERTIFICATE]: t('tab.todistukset')
    },
    tabTextByExam: {
      [Exam.SUKO]: t('tab.suko'),
      [Exam.LD]: t('tab.ld'),
      [Exam.PUHVI]: t('tab.puhvi')
    },
    returnTextByContentType: {
      [ContentType.ASSIGNMENT]: t('assignment.palaa'),
      [ContentType.INSTRUCTION]: t('instruction.palaa'),
      [ContentType.CERTIFICATE]: t('certificate.palaa')
    },
    contentErrorMessage: {
      [ContentType.ASSIGNMENT]: t('error.koetehtavan-lataus-epaonnistui'),
      [ContentType.INSTRUCTION]: t('error.ohjeen-lataus-epaonnistui'),
      [ContentType.CERTIFICATE]: t('error.todistuksen-lataus-epaonnistui')
    },
    contentListErrorMessage: {
      [ContentType.ASSIGNMENT]: t('error.koetehtavien-lataus-epaonnistui'),
      [ContentType.INSTRUCTION]: t('error.ohjeiden-lataus-epaonnistui'),
      [ContentType.CERTIFICATE]: t('error.todistusten-lataus-epaonnistui')
    },
    contentDeleteModalTitle: {
      [ContentType.ASSIGNMENT]: t('form.assignment.delete-modal.title'),
      [ContentType.INSTRUCTION]: t('form.instruction.delete-modal.title'),
      [ContentType.CERTIFICATE]: t('form.certificate.delete-modal.title')
    },
    contentDeleteModalText: {
      [ContentType.ASSIGNMENT]: (tehtavanNimi: string) => t('form.assignment.delete-modal.text', { tehtavanNimi }),
      [ContentType.INSTRUCTION]: (ohjeenNimi: string) => t('form.instruction.delete-modal.text', { ohjeenNimi }),
      [ContentType.CERTIFICATE]: (todistuksenNimi: string) =>
        t('form.certificate.delete-modal.text', { todistuksenNimi })
    },
    contentCreateSuccessNotification: {
      [ContentType.ASSIGNMENT]: {
        [PublishState.Published]: t('form.notification.tehtavan-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.tehtavan-tallennus.luonnos-onnistui')
      },
      [ContentType.INSTRUCTION]: {
        [PublishState.Published]: t('form.notification.ohjeen-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.ohjeen-tallennus.luonnos-onnistui')
      },
      [ContentType.CERTIFICATE]: {
        [PublishState.Published]: t('form.notification.todistuksen-tallennus.julkaisu-onnistui'),
        [PublishState.Draft]: t('form.notification.todistuksen-tallennus.luonnos-onnistui')
      }
    },
    contentUpdateSuccessNotification: {
      [ContentType.ASSIGNMENT]: {
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
      [ContentType.INSTRUCTION]: {
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
      [ContentType.CERTIFICATE]: {
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
      [ContentType.ASSIGNMENT]: t('filter.koetehtavat-kieli'),
      [ContentType.INSTRUCTION]: t('filter.ohjeet-kieli'),
      [ContentType.CERTIFICATE]: t('filter.todistukset-kieli')
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
      [ContentType.ASSIGNMENT]: t('form.notification.tehtavan-tallennus.epaonnistui'),
      [ContentType.INSTRUCTION]: t('form.notification.ohjeen-tallennus.epaonnistui'),
      [ContentType.CERTIFICATE]: t('form.notification.todistuksen-tallennus.epaonnistui')
    },
    formDeleteErrorNotificationMessage: {
      [ContentType.ASSIGNMENT]: t('form.notification.tehtavan-poisto.epaonnistui'),
      [ContentType.INSTRUCTION]: t('form.notification.ohjeen-poisto.epaonnistui'),
      [ContentType.CERTIFICATE]: t('form.notification.todistuksen-poisto.epaonnistui')
    },
    favoritePageNoContentMessage: {
      [Exam.SUKO]: t('favorite.suko.ei-suosikkitehtavia'),
      [Exam.LD]: t('favorite.ld.ei-suosikkitehtavia'),
      [Exam.PUHVI]: t('favorite.puhvi.ei-suosikkitehtavia')
    },
    checkboxOptionTexts: {
      [AddToFavoriteOptions.FAVORITES]: t('favorite.lisaa-suosikiksi-paatasolle'),
      [AddToFavoriteOptions.FOLDER]: t('favorite.lisaa-kansioon'),
      [AddToFavoriteOptions.NEW_FOLDER]: t('favorite.lisaa-uuteen-kansioon-paatasolle')
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
