import { expect, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'

const exams = ['suko', 'puhvi', 'ld']
const contentTypes = [
  ['assignments', 'koetehtavat'],
  ['instructions', 'ohjeet'],
  ['certificates', 'todistukset']
]

const pageIds = ['etusivu', 'suko', 'ld', 'puhvi', 'palautteet']

loginTestGroup(test, Role.YLLAPITAJA)

test('navigation links work', async ({ page }) => {
  await page.goto('/')

  for (const pageId of pageIds) {
    const navLink = page.getByTestId(`nav-link-${pageId}`)

    await navLink.click()

    expect(page.getByTestId(`page-heading-${pageId}`)).toBeVisible()
  }

  await page.goto('/')

  for (const exam of exams) {
    const boxRow = page.getByTestId(`/${exam}`)

    for (const [contentTypeEng, contentTypeFi] of contentTypes) {
      await boxRow.getByTestId(`nav-box-${contentTypeEng}`).click()
      expect(await page.locator('h2').getAttribute('data-testid')).toBe(`page-heading-${exam}`)
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
