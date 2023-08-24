import { expect, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'

const exams = ['suko', 'puhvi', 'ld']
const contentTypes = [
  ['assignments', 'koetehtavat'],
  ['instructions', 'ohjeet'],
  ['certificates', 'todistukset']
]

const pages = [
  ['etusivu', 'etusivu'],
  ['suko', 'SUKO'],
  ['ld', 'LD'],
  ['puhvi', 'PUHVI'],
  ['feedback', 'feedback']
]

loginTestGroup(test, Role.YLLAPITAJA)

test('navigation links work', async ({ page }) => {
  await page.goto('/')

  for (const [pageNavId, pageHeadingId] of pages) {
    const navLink = page.getByTestId(`nav-link-${pageNavId}`)

    await navLink.click()

    expect(page.getByTestId(`page-heading-${pageHeadingId}`)).toBeVisible()
  }

  await page.goto('/')

  for (const exam of exams) {
    const boxRow = page.getByTestId(`/${exam}`)

    for (const [contentTypeEng, contentTypeFi] of contentTypes) {
      await boxRow.getByTestId(`nav-box-${contentTypeEng}`).click()
      expect(await page.locator('h2').getAttribute('data-testid')).toBe(`page-heading-${exam.toLocaleUpperCase()}`)
      for (const [_, contentTypeFi2] of contentTypes) {
        expect(
          await page.getByTestId(`tab-${contentTypeFi2}`).getAttribute('aria-expanded'),
          `Expected ${contentTypeFi} to be expanded and other tabs not`
        ).toBe(contentTypeFi === contentTypeFi2 ? 'true' : 'false')
      }
      await page.goBack()
    }
  }
})
