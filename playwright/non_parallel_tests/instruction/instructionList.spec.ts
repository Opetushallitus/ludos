import { expect, Page, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { checkListAfterFilteringWithProvidedContent } from '../../filterHelpers'
import {
  loginTestGroup,
  resetDatabase,
  Role,
  setMultiSelectDropdownOptions,
  setSingleSelectDropdownOption,
  setTeachingLanguage
} from '../../helpers'

const bodyTextByExam = {
  [Exam.SUKO]: (number: number) => `Test short description ${number} FI`,
  [Exam.LD]: (number: number) => `LD Test name ${number} FI`,
  [Exam.PUHVI]: (number: number) => `PUHVI Test short description ${number} FI`
}

const checkListAfterFilteringWithProvidedExam = checkListAfterFilteringWithProvidedContent(bodyTextByExam)

const assertLanguageChange = async (page: Page, expectedSvText: string) => {
  await setTeachingLanguage(page, 'SV')
  await expect(page.getByTestId('card-body').first()).toHaveText(expectedSvText)
}

loginTestGroup(test, Role.YLLAPITAJA)
test.describe('Instruction filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabase(page)
    await page.goto('/api/test/seedInstructions')
  })

  const expectedNumbersInBodyTexts = Array.from({ length: 12 }, (_, i) => 11 - i)

  test('suko', async ({ page }) => {
    await page.goto('/suko/ohjeet')
    const checkSukoList = checkListAfterFilteringWithProvidedExam(page, Exam.SUKO)

    await expect(page.getByTestId('create-ohje-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkSukoList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkSukoList(expectedNumbersInBodyTexts)

    await assertLanguageChange(page, 'Test short description 11 SV')
  })

  test('ld', async ({ page }) => {
    await page.goto('/ld/ohjeet')
    const checkLdList = checkListAfterFilteringWithProvidedExam(page, Exam.LD)

    await expect(page.getByTestId('create-ohje-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkLdList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkLdList(expectedNumbersInBodyTexts)

    await setMultiSelectDropdownOptions(page, 'aineFilter', ['1'])
    await checkLdList([9, 0])
    // check the content page and that filter is still applied when going back to list
    await page.getByTestId('card-title').first().click()
    await expect(page.getByTestId('instruction-aine')).toHaveText('Kotitalous')
    await page.getByTestId('return').click()
    await checkLdList([9, 0])
    // check the content page, go edit form, submit, assert that filter is still applied when going back to list
    await page.getByTestId('card-title').first().click()
    await page.getByTestId('edit-content-btn').click()
    await page.getByTestId('form-submit').click()
    await page.getByTestId('return').click()
    await checkLdList([9, 0])

    await assertLanguageChange(page, 'LD Test name 9 SV')
  })

  test('puhvi', async ({ page }) => {
    await page.goto('/puhvi/ohjeet')
    const checkPuhviList = checkListAfterFilteringWithProvidedExam(page, Exam.PUHVI)

    await expect(page.getByTestId('create-ohje-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkPuhviList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkPuhviList(expectedNumbersInBodyTexts)

    await assertLanguageChange(page, 'PUHVI Test short description 11 SV')
  })
})
