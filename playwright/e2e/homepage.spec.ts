import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  const el = page.getByTestId('heading')

  await expect(el).toHaveText('Hei Yrjö Ylivoima, tervetuloa Koepankin ylläpitoon!')
})

const examTypes = ['/suko', '/puhvi', '/ld']
const assignmentTypes = ['koetehtävät', 'ohjeet', 'todistukset']

const assignmentsSingular: Record<string, string> = {
  koetehtävät: 'koetehtävä',
  ohjeet: 'ohje',
  todistukset: 'todistus'
}

const titles: Record<string, string> = {
  '/suko': 'Suullinen kielitaito',
  '/puhvi': 'Puheviestintä',
  '/ld': 'Lukiodiplomit'
}

test('naviation links work', async ({ page }) => {
  await page.goto('/')

  for (const examType of examTypes) {
    const divElem = page.getByTestId(`exam-type-${examType}`)
    console.log(divElem)
    for (const assignmentType of assignmentTypes) {
      await divElem.getByTestId(`nav-box-${assignmentType}`).click()
      const heading2 = page.locator('h2')

      expect(await heading2.innerText()).toBe(titles[examType])

      const addBtn = page.getByTestId(`create-${assignmentType}-button`)

      expect(await addBtn.innerText()).toBe(`+ Lisää ${assignmentsSingular[assignmentType]}`)

      await page.goBack()
    }
  }
})
