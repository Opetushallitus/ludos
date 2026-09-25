import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import { ludosUILanguageKey } from '../contexts/LudosContext'
import { Language } from '../types'
import { buttonClasses } from './Button'
import { ExternalLink } from './ExternalLink'
import { Footer } from './Footer'
import { UiLanguageDropdown } from './header/HeaderUiLanguageDropdown'

const TEXTS = {
  [Language.FI]: {
    title: 'LUDOS – Kirjaudu sisään',
    welcome: 'Tervetuloa Ludos-palveluun',
    login: 'Kirjaudu sisään',
    instructions: 'Ohjeet LUDOS-palveluun kirjautumiseen'
  },
  [Language.SV]: {
    title: 'LUDOS – Logga in',
    welcome: 'Välkommen till Ludos-tjänsten',
    login: 'Logga in',
    instructions: 'Anvisningar för inloggning i LUDOS-tjänsten'
  }
}

type LandingPageLanguage = keyof typeof TEXTS

const INSTRUCTIONS_URL =
  'https://www.oph.fi/fi/koulutus-ja-tutkinnot/ludos-palvelu-lukiodiplomipalvelu-suullisen-kielitaidon-arviointi-ja'

function isLandingPageLanguage(lang: string | null | undefined): lang is LandingPageLanguage {
  return lang === Language.FI || lang === Language.SV
}

function initialLanguage(langParam: string | null): LandingPageLanguage {
  const lang = langParam?.toUpperCase() ?? localStorage.getItem(ludosUILanguageKey)
  if (isLandingPageLanguage(lang)) {
    return lang
  }
  return navigator.language.toLowerCase().startsWith('sv') ? Language.SV : Language.FI
}

export const LandingPage = () => {
  const [searchParams] = useSearchParams()
  const [lang, setLang] = useState(() => initialLanguage(searchParams.get('lang')))
  const texts = TEXTS[lang]
  const { i18n } = useTranslation()

  const changeLanguage = (language: string) => {
    if (isLandingPageLanguage(language)) {
      setLang(language)
      localStorage.setItem(ludosUILanguageKey, language)
    }
  }

  const loginUrl = `/api/auth/login?to=${encodeURIComponent(searchParams.get('to') ?? '/')}`

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
    document.title = texts.title
    void i18n.changeLanguage(lang)
  }, [lang, texts.title, i18n])

  return (
    <div className="grid min-h-[98vh] max-w-full grid-rows-[auto,1fr,auto] md:grid-rows-[6rem,1fr,7rem]">
      <header className="border-t-5 border-green-primary bg-gray-bg">
        <div className="flex justify-center py-3 md:pb-0">
          <div className="row w-[80vw] items-center justify-between">
            <h1>LUDOS</h1>
            <div className="border-l border-green-primary pl-2">
              <UiLanguageDropdown value={lang} onChange={changeLanguage} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex justify-center">
        <section className="mt-10 w-[80vw]">
          <h2>{texts.welcome}</h2>

          <div className="mt-8 max-w-xl rounded-md border-2 border-t-4 border-gray-light border-t-green-primary p-5 md:p-8">
            <a
              className={twMerge(
                buttonClasses('buttonPrimary'),
                'block w-full px-6 py-4 text-center text-lg font-semibold'
              )}
              href={loginUrl}
              data-testid="login-button"
            >
              {texts.login}
            </a>

            <div className="mt-6 border-l-4 border-green-primary bg-gray-bg px-4 py-3 text-sm">
              <ExternalLink url={INSTRUCTIONS_URL}>{texts.instructions}</ExternalLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
