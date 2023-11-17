import { Page } from '@playwright/test'

export class LayoutModel {
  constructor(
    readonly page: Page,
    readonly languageDropdown = page.getByTestId('header-language-dropdown'),
    readonly languageDropdownExpandButton = page.getByTestId('header-language-dropdown-expand')
  ) {}

  async showLocalizationKeys() {
    await this.languageDropdownExpandButton.click()
    await this.languageDropdown.getByText('Näytä avaimet').click()
  }
}
