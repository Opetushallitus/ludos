import { expect, Page, test } from '@playwright/test'
import { login, Role, setTeachingLanguage } from '../helpers'
import { LayoutModel } from '../models/LayoutModel'
import { TeachingLanguage } from 'web/src/types'

async function assertUiLanguage(page: Page, language: string) {
  await expect(page.getByTestId('nav-link-etusivu')).toHaveText(language === 'fi' ? 'Etusivu' : 'Hem')
}

async function navigateToPuhviInstructionList(page: Page) {
  await page.getByTestId('nav-link-etusivu').click()
  await page.getByTestId('/puhvi').getByTestId('nav-box-ohjeet').click()
}

async function assertTeachingLanguageSelect(page: Page, language: TeachingLanguage) {
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
  await page.goto('/')
})

test('Business language is the default for UI, teaching language and koodisto language', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'SV')

  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'sv')
})

test('Explicit UI language choice is honored over reloads', async ({ page }) => {
  const layout = new LayoutModel(page)

  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'SV')

  await layout.setUiLanguage('fi')
  await assertUiLanguage(page, 'fi')
  await assertTeachingLanguageSelect(page, 'SV')
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'fi')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, 'fi')
  await assertTeachingLanguageSelect(page, 'SV')
})

test('Explicit teaching language choice is honored over reloads', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'SV')

  await setTeachingLanguage(page, 'FI')
  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'FI')
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, 'sv')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, 'sv')
  await assertTeachingLanguageSelect(page, 'FI')
})
