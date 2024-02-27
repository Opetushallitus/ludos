import { expect, test } from '@playwright/test'
import { examsLowerCase, loginTestGroup, Role } from '../helpers'
import { ContentType, ContentTypePluralFi } from 'web/src/types'

const contentTypes = Object.values(ContentType)

const pageIds = ['etusivu', 'suko', 'ld', 'puhvi']

loginTestGroup(test, Role.YLLAPITAJA)

test('navigation links work', async ({ page }) => {
  await page.goto('/')

  for (const pageId of pageIds) {
    const navLink = page.getByTestId(`nav-link-${pageId}`)

    await navLink.click()

    await expect(page.getByTestId(`page-heading-${pageId}`)).toBeVisible()
  }

  await page.goto('/')

  for (const exam of examsLowerCase) {
    const boxRow = page.getByTestId(`/${exam}`)

    for (const contentType of contentTypes) {
      await boxRow.getByTestId(`nav-box-${ContentTypePluralFi[contentType]}`).click()
      expect(await page.locator('h2').getAttribute('data-testid')).toBe(`page-heading-${exam}`)
      for (const contentType2 of contentTypes) {
        expect(
          await page.getByTestId(`tab-${ContentTypePluralFi[contentType2]}`).getAttribute('aria-current'),
          `Expected ${contentType} to be expanded and other tabs not`
        ).toBe(contentType === contentType2 ? 'page' : null)
      }
      await page.goBack()
    }
  }
})
