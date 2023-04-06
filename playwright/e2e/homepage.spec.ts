import { expect, test } from '@playwright/test'

const examTypes = ['suko', 'puhvi', 'ld']
const assignmentTypes = ['assignments', 'instructions', 'certificates']

const titles: Record<string, string> = {
  suko: 'Suullinen kielitaito',
  puhvi: 'Puheviestintä',
  ld: 'Lukiodiplomit'
}

const pages = ['etusivu', 'content-suko', 'content-puhvi', 'content-ld', 'feedback']

test('naviation links work', async ({ page }) => {
  await page.goto('/')

  for (const pageName of pages) {
    const navLink = page.getByTestId(`nav-link-${pageName}`)

    await navLink.click()

    expect(page.getByTestId(`page-heading-${pageName}`)).toBeTruthy()
  }

  await page.goto('/')

  for (const contentType of examTypes) {
    const boxRow = page.getByTestId(contentType)

    for (const assignmentType of assignmentTypes) {
      await boxRow.getByTestId(`nav-box-${assignmentType}`).click()
      const heading2 = page.locator('h2')

      expect(await heading2.innerText()).toBe(titles[contentType])

      const addBtn = page.getByTestId(`create-koetehtävä-button`)

      expect(await addBtn.innerText()).toBe(`+ Lisää koetehtävä`)

      await page.goBack()
    }
  }
})
