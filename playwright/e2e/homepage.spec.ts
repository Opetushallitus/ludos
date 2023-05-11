import { expect, test } from '@playwright/test'

const exams = ['suko', 'puhvi', 'ld']
const contentTypes = ['assignments', 'instructions', 'certificates']

const pages = ['etusivu', 'suko', 'puhvi', 'ld', 'feedback']

test('navigation links work', async ({ page }) => {
  await page.goto('/')

  for (const pageName of pages) {
    const navLink = page.getByTestId(`nav-link-${pageName}`)

    await navLink.click()

    expect(page.getByTestId(`page-heading-${pageName}`)).toBeTruthy()
  }

  await page.goto('/')

  for (const exam of exams) {
    const boxRow = page.getByTestId(`/${exam}`)

    for (const contentType of contentTypes) {
      await boxRow.getByTestId(`nav-box-${contentType}`).click()
      const heading2 = page.locator('h2')

      expect(await heading2.getAttribute('data-testid')).toBe(`page-heading-${exam.toLocaleUpperCase()}`)

      await page.goBack()
    }
  }
})
