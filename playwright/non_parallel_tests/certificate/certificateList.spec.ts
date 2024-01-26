import { expect, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { checkListAfterFilteringWithProvidedContent } from '../../filterHelpers'
import { loginTestGroup, Role, setSingleSelectDropdownOption } from '../../helpers'

const bodyTextByExam = {
  [Exam.SUKO]: (number: number) => `SUKO Test Certificate Description ${number}`,
  [Exam.LD]: (number: number) => `LD Test Certificate ${number} FI`,
  [Exam.PUHVI]: (number: number) => `PUHVI Test Certificate ${number} FI`
}
const checkListAfterFilteringWithProvidedExam = checkListAfterFilteringWithProvidedContent(bodyTextByExam)

loginTestGroup(test, Role.YLLAPITAJA)
test.describe('Certificate filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/test/empty')
    await page.goto('/api/test/seedCertificates')
  })

  const expectedNumbersInBodyTexts = Array.from({ length: 4 }, (_, i) => 3 - i)

  test('suko', async ({ page }) => {
    await page.goto('/suko/todistukset')
    const checkSukoList = checkListAfterFilteringWithProvidedExam(page, Exam.SUKO)

    await expect(page.getByTestId('create-todistus-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkSukoList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkSukoList(expectedNumbersInBodyTexts)
  })

  test('ld', async ({ page }) => {
    await page.goto('/ld/todistukset')
    const checkLdList = checkListAfterFilteringWithProvidedExam(page, Exam.LD)

    await expect(page.getByTestId('create-todistus-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkLdList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkLdList(expectedNumbersInBodyTexts)
  })

  test('puhvi', async ({ page }) => {
    await page.goto('/puhvi/todistukset')
    const checkPuhviList = checkListAfterFilteringWithProvidedExam(page, Exam.PUHVI)

    await expect(page.getByTestId('create-todistus-button')).toBeVisible()
    await setSingleSelectDropdownOption(page, 'orderFilter', 'asc')
    await checkPuhviList(expectedNumbersInBodyTexts.slice().reverse())
    await setSingleSelectDropdownOption(page, 'orderFilter', 'desc')
    await checkPuhviList(expectedNumbersInBodyTexts)
  })
})
