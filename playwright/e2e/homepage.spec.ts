import { expect, test } from '@playwright/test'

const examTypes = ['/exam/suko', '/exam/puhvi', '/exam/ld']
const assignmentTypes = ['koetehtävät', 'ohjeet', 'todistukset']

const assignmentsSingular: Record<string, string> = {
  koetehtävät: 'koetehtävä',
  ohjeet: 'ohje',
  todistukset: 'todistus'
}

const titles: Record<string, string> = {
  '/exam/suko': 'Suullinen kielitaito',
  '/exam/puhvi': 'Puheviestintä',
  '/exam/ld': 'Lukiodiplomit'
}

const pages = ['etusivu', 'exam-suko', 'exam-puhvi', 'exam-ld', 'feedback']

test('naviation links work', async ({ page }) => {
  await page.goto('/')

  for (const pageName of pages) {
    const navLink = page.getByTestId(`nav-link-${pageName}`)

    await navLink.click()

    expect(page.getByTestId(`page-heading-${pageName}`)).toBeTruthy()
  }

  await page.goto('/')

  for (const examType of examTypes) {
    const boxRow = page.getByTestId(`exam-type-${examType}`)

    for (const assignmentType of assignmentTypes) {
      await boxRow.getByTestId(`nav-box-${assignmentType}`).click()
      const heading2 = page.locator('h2')

      expect(await heading2.innerText()).toBe(titles[examType])

      const addBtn = page.getByTestId(`create-koetehtävä-button`)

      expect(await addBtn.innerText()).toBe(`+ Lisää koetehtävä`)

      await page.goBack()
    }
  }
})
