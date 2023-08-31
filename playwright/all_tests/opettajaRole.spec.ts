import { expect, test } from '@playwright/test'
import { loginTestGroup, Role } from '../helpers'

const pages = ['suko', 'puhvi', 'ld']

loginTestGroup(test, Role.OPETTAJA)

test('fail to create suko assignment, instruction and certificate', async ({ page }) => {
  await page.goto('/')

  for (const pageName of pages) {
    const navLink = page.getByTestId(`nav-link-${pageName}`)

    await navLink.click()
    await expect(page.getByTestId('create-koetehtava-button')).toBeHidden()
    await page.getByTestId('tab-ohjeet').click()
    await expect(page.getByTestId('create-ohje-button')).toBeHidden()
    await page.getByTestId('tab-todistukset').click()
    await expect(page.getByTestId('create-todistus-button')).toBeHidden()
  }
})

test('fail to navigate to new and update form pages', async ({ page }) => {
  await page.goto('/')

  for (const action of ['new', 'update/1']) {
    for (const pageName of pages) {
      for (const contentType of ['assignments', 'instructions', 'certificates']) {
        await page.goto(`/${pageName}/${contentType}/${action}`)
        await expect(page.getByTestId('unauthorizedPage')).toBeVisible()
      }
    }
  }
})
