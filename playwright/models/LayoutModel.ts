import { Page } from '@playwright/test'
import { BusinessLanguage } from 'web/src/types'
import { setSingleSelectDropdownOption } from '../helpers'

export class LayoutModel {
  constructor(
    readonly page: Page,
    readonly languageDropdown = page.getByTestId('header-language-dropdown'),
    readonly languageDropdownExpandButton = languageDropdown.getByTestId('header-language-dropdown-expand'),
    readonly footer = page.getByTestId('footer'),
    readonly footerFeedbackLink = footer.getByTestId('feedback-link')
  ) {}

  async setUiLanguage(language: BusinessLanguage) {
    await setSingleSelectDropdownOption(this.page, 'languageDropdown', language)
  }

  async showLocalizationKeys() {
    await setSingleSelectDropdownOption(this.page, 'languageDropdown', 'keys')
  }
}
