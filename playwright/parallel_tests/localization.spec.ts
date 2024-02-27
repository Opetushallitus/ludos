import { expect, Page, test } from '@playwright/test'
import { login, Role, setTeachingLanguage } from '../helpers'
import { LayoutModel } from '../models/LayoutModel'
import { Language } from 'web/src/types'

async function assertUiLanguage(page: Page, language: Language) {
  await expect(page.getByTestId('nav-link-etusivu')).toHaveText(language === Language.FI ? 'Etusivu' : 'Hem')
}

async function navigateToPuhviInstructionList(page: Page) {
  await page.getByTestId('nav-link-etusivu').click()
  await page.getByTestId('/puhvi').getByTestId('nav-box-ohjeet').click()
}

async function assertTeachingLanguageSelect(page: Page, language: Language) {
  await expect(page.locator('input[name="teachingLanguageDropdown"]')).toHaveValue(language)
}

async function assertKoodistoLanguageInPuhviKoetehtavaForm(page: Page, language: Language) {
  await page.getByTestId('nav-link-etusivu').click()
  await page.getByTestId('/puhvi').getByTestId('nav-box-koetehtavat').click()
  await page.getByTestId('create-koetehtava-button').click()
  await expect(page.locator('label[for="001"]')).toHaveText(
    language === Language.FI ? 'Ryhmäviestintätaidot' : 'Gruppdiskussion'
  )
}

test.beforeEach(async ({ page }) => {
  await login(page, Role.YLLAPITAJA, 'sv')
  await page.goto('/')
})

test('Business language is the default for UI, teaching language and koodisto language', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, Language.SV)
  await assertTeachingLanguageSelect(page, Language.SV)

  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, Language.SV)
})

test('Explicit UI language choice is honored over reloads', async ({ page }) => {
  const layout = new LayoutModel(page)

  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, Language.SV)
  await assertTeachingLanguageSelect(page, Language.SV)

  await layout.setUiLanguage(Language.FI)
  await assertUiLanguage(page, Language.FI)
  await assertTeachingLanguageSelect(page, Language.SV)
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, Language.FI)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, Language.FI)
  await assertTeachingLanguageSelect(page, Language.SV)
})

test('Explicit teaching language choice is honored over reloads', async ({ page }) => {
  await navigateToPuhviInstructionList(page)

  await assertUiLanguage(page, Language.SV)
  await assertTeachingLanguageSelect(page, Language.SV)

  await setTeachingLanguage(page, Language.FI)
  await assertUiLanguage(page, Language.SV)
  await assertTeachingLanguageSelect(page, Language.FI)
  await assertKoodistoLanguageInPuhviKoetehtavaForm(page, Language.SV)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await navigateToPuhviInstructionList(page)
  await assertUiLanguage(page, Language.SV)
  await assertTeachingLanguageSelect(page, Language.FI)
})
