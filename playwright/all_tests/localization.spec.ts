import { expect, test, Page } from '@playwright/test'
import { login, Role, setSingleSelectDropdownOption, setTeachingLanguage } from '../helpers'

async function assertUiLanguage(page: Page, language: string) {
  await expect(page.getByTestId('nav-link-etusivu')).toHaveText(language === 'fi' ? 'Etusivu' : 'Hem')
}

async function navigateToPuhviInstructionList(page: Page) {
  await page.getByTestId('nav-link-etusivu').click()
  await page.getByTestId('/puhvi').getByTestId('nav-box-ohjeet').click()
}

async function assertTeachingLanguageSelect(page: Page, language: string) {
  await expect(page.locator('input[name="teachingLanguageDropdown"]')).toHaveValue(language)
}

async function assertKoodistoLanguageInPuhviKoetehtavaForm(page: Page, language: string) {
  await page.getByTestId('nav-link-etusivu').click()
  await page.getByTestId('/puhvi').getByTestId('nav-box-koetehtavat').click()
  await page.getByTestId('create-koetehtava-button').click()
  await expect(page.locator('label[for="001"]')).toHaveText(
    language === 'fi' ? 'Ryhmäviestintätaidot' : 'Gruppdiskussion'
  )
}

test.beforeEach(async ({ page }) => {
  await login(page, Role.YLLAPITAJA, 'sv')
})

test('Business language is the default for UI, teaching language and koodisto language', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'sv')

  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'sv')
})

test('Explicit UI language choice is honored over reloads', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'sv')

  await page.getByTestId('header-language-dropdown-expand').click()
  await page.getByTestId('header-language-dropdown').getByTestId('fi').click()
  await assertUiLanguage(page, 'fi')
  await assertTeachingLanguageSelect(page, 'sv')
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'fi')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, 'fi')
  await assertTeachingLanguageSelect(page, 'sv')
})

test('Explicit teaching language choice is honored over reloads', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'sv')

  await setTeachingLanguage(page, 'fi')
  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'fi')
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'sv')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'fi')
})
