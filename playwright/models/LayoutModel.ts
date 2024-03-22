import { Page } from '@playwright/test'
import { Language } from 'web/src/types'
import { setSingleSelectDropdownOption } from '../helpers'

export class LayoutModel {
  constructor(
    readonly page: Page,
    readonly languageDropdown = page.getByTestId('header-language-dropdown'),
    readonly headerEtusivu = page.getByTestId('nav-link-etusivu'),
    readonly headerSuko = page.getByTestId('nav-link-suko'),
    readonly headerLd = page.getByTestId('nav-link-ld'),
    readonly headerPuhvi = page.getByTestId('nav-link-puhvi'),
    readonly footer = page.getByTestId('footer'),
    readonly footerFeedbackLink = footer.getByTestId('feedback-link'),
    readonly consentModal = page.getByTestId('consent-modal'),
    readonly consentModalSettingsButton = consentModal.getByTestId('settings-button'),
    readonly consentModalAcceptSelectedButton = consentModal.getByTestId('accept-selected-button'),
    readonly consentModalAcceptAllButton = consentModal.getByTestId('accept-all-button'),
    readonly consentModalTrackingCheckbox = consentModal.getByTestId('consent-tracking-checkbox'),
    readonly consentModalFooterButton = footer.getByTestId('privacy-settings-button'),
    readonly partialMatomoAnalyticsUrl = 'analytiikka.opintopolku.fi/matomo/matomo.php?action_name=LUDOS'
  ) {}

  async setUiLanguage(language: Language) {
    await setSingleSelectDropdownOption(this.page, 'languageDropdown', language)
  }

  async showLocalizationKeys() {
    await setSingleSelectDropdownOption(this.page, 'languageDropdown', 'keys')
  }

  async navHeaderGoToPageByExam(exam: string) {
    await this.page.getByTestId(`nav-link-${exam.toLowerCase()}`).click()
  }

  async acceptAllCookies() {
    await this.consentModalAcceptAllButton.click()
  }

  async acceptOnlyNecessaryCookies() {
    await this.consentModalSettingsButton.click()
    await this.consentModalAcceptSelectedButton.click()
  }
}
