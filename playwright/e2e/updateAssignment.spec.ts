import { expect, test } from '@playwright/test'

test.describe('Assignment form tests', () => {
  let createdAssignmentId: number

  test('can create a new assignment', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('nav-link-content-suko').click()

    await page.getByTestId('create-koetehtava-button').click()

    const nameText = 'Testi tehtävä'
    const contentText = 'Testi sisältö'

    await page.getByLabel('form.tehtavannimi').fill(nameText)
    await page.getByLabel('Tekstin lukeminen').click()
    await page.getByLabel('form.tehtavansisalto').fill(contentText)

    await page.getByTestId('form-submit').click()

    const response = await page.waitForResponse((response) => {
      return response.url().includes('/api/assignment/') && response.ok()
    })

    const responseData = await response.json()
    createdAssignmentId = responseData.id

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi tehtävä')

    await page.getByTestId('return').click()

    console.log(createdAssignmentId)
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}`).click()
    await page.getByTestId(`assignment-${createdAssignmentId.toString()}-edit`).click()

    const updatedNameText = 'Testi tehtävä muokattu'
    const updatedContentText = 'Testi sisältö muokattu'

    await page.getByLabel('form.tehtavannimi').fill(updatedNameText)
    await page.getByLabel('Tekstin lukeminen').click()
    await page.getByLabel('form.tehtavansisalto').fill(updatedContentText)

    await page.getByTestId('form-submit').click()

    const updatedAssignmentHeader = page.getByTestId('assignment-header')

    await expect(updatedAssignmentHeader).toHaveText('Testi tehtävä muokattu')
  })
})
