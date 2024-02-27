import { Page } from '@playwright/test'
import { Language } from 'web/src/types'
import { setSingleSelectDropdownOption } from '../helpers'

export class LayoutModel {
  constructor(
    readonly page: Page,
    readonly languageDropdown = page.getByTestId('header-language-dropdown'),
    readonly footer = page.getByTestId('footer'),
    readonly footerFeedbackLink = footer.getByTestId('feedback-link')
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
}
