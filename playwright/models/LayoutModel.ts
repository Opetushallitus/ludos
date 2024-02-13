import { Page } from '@playwright/test'
import { BusinessLanguage } from 'web/src/types'

export class LayoutModel {
  constructor(
    readonly page: Page,
    readonly languageDropdown = page.getByTestId('header-language-dropdown'),
    readonly languageDropdownExpandButton = languageDropdown.getByTestId('header-language-dropdown-expand'),
    readonly footer = page.getByTestId('footer'),
    readonly footerFeedbackLink = footer.getByTestId('feedback-link')
  ) {}

  async setUiLanguage(language: BusinessLanguage) {
    await this.languageDropdownExpandButton.click()
    await this.languageDropdown.getByTestId(language).click()
  }

  async showLocalizationKeys() {
    await this.languageDropdownExpandButton.click()
    await this.languageDropdown.getByTestId('keys').click()
  }
}
