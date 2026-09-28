import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'
import { ludosUILanguageKey } from '../contexts/LudosContext'
import { Language } from '../types'
import { buttonClasses } from './Button'
import { Footer } from './Footer'
import { UiLanguageDropdown } from './header/HeaderUiLanguageDropdown'

function isLanguage(lang: string | null | undefined): lang is Language {
  return lang === Language.FI || lang === Language.SV
}

function initialLanguage(langParam: string | null): Language {
  const candidates = [
    langParam?.toUpperCase(),
    localStorage.getItem(ludosUILanguageKey),
    navigator.language.slice(0, 2).toUpperCase()
  ]
  return candidates.find(isLanguage) ?? Language.FI
}

export const LandingPage = () => {
  const [searchParams] = useSearchParams()
  const [lang, setLang] = useState(() => initialLanguage(searchParams.get('lang')))
  const { i18n } = useTranslation()
  const t = i18n.getFixedT(lang)
  const title = `${t('title.ludos')} – ${t('landing-page.kirjaudu-sisaan')}`

  const changeLanguage = (language: string) => {
    if (isLanguage(language)) {
      setLang(language)
      localStorage.setItem(ludosUILanguageKey, language)
    }
  }

  const loginUrl = `/api/auth/login?to=${encodeURIComponent(searchParams.get('to') ?? '/')}`

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
    document.title = title
    void i18n.changeLanguage(lang)
  }, [lang, i18n, title])

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
          <h2>{t('landing-page.tervetuloa')}</h2>
          <p className="mt-4 max-w-xl">{t('landing-page.kuvausteksti')}</p>

          <div className="mt-8 max-w-xl rounded-md border-2 border-t-4 border-gray-light border-t-green-primary p-5 md:p-8">
            <a
              className={twMerge(
                buttonClasses('buttonPrimary'),
                'block w-full px-6 py-4 text-center text-lg font-semibold'
              )}
              href={loginUrl}
              data-testid="login-button"
            >
              {t('landing-page.kirjaudu-sisaan')}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
