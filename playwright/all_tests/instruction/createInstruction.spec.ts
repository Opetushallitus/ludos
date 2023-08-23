import { expect, test } from '@playwright/test'
import { fillInstructionForm } from './instructionHelpers'
import { Role, loginTestGroup } from '../../helpers'
import path from 'path'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Assignment form tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('tab-ohjeet').click()
    await page.getByTestId('create-ohje-button').click()
  })

  let instructionToUpdate: number

  test('can create a new instruction and update its values', async ({ page }) => {
    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje',
      nameTextSv: 'Testuppgifter',
      contentTextFi: 'Testi sisältö',
      contentTextSv: 'Testa innehåll',
      shortDescriptionFi: 'Testi lyhyt kuvaus',
      shortDescriptionSv: 'Testa kort beskrivning',
      attachmentNameFi: 'Testi liite',
      attachmentNameSv: 'Testa bilaga'
    })

    await page.getByTestId('form-submit').click()

    const response = await page.waitForResponse(
      (response) => response.url().includes('/api/instruction') && response.ok()
    )

    const responseData = await response.json()

    instructionToUpdate = responseData.id

    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi ohje')
    // check short description
    await page.getByText('Testi lyhyt kuvaus', { exact: true })
    // check content
    await page.getByText('Testi sisältö', { exact: true })
    // check files
    await page.getByText('Testi liite 1', { exact: true })
    await page.getByText('Testi liite 2', { exact: true })

    // change language and check that everything is correct
    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    await expect(header).toHaveText('Testuppgifter')
    await page.getByText('Testa kort beskrivning', { exact: true })
    await page.getByText('Testa innehåll', { exact: true })
    await page.getByText('Testa bilaga 1', { exact: true })
    await page.getByText('Testa bilaga 2', { exact: true })

    // update instruction
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('tab-ohjeet').click()
    await page.getByTestId(`instruction-${instructionToUpdate}`)
    await page.getByTestId(`instruction-${instructionToUpdate}-edit`).click()

    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje muokattu',
      nameTextSv: 'Testuppgifter redigerade',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testinstruktioner redigerade'
    })

    await page.getByTestId('form-submit').click()

    const updatedInstructionHeader = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeader).toHaveText('Testi ohje muokattu')

    await page.getByTestId('language-dropdown').click()
    await page.getByTestId('language-dropdown-option-sv').click()

    const updatedInstructionHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeaderSv).toHaveText('Testuppgifter redigerade')

    await page.getByTestId('edit-content-btn').first().click()
    // delete one finnish file
    await page.getByTestId('delete-attachment-icon-0').first().click()
    await page.getByTestId('modal-button-delete').first().click()
    // rename other finnish file
    await page.getByTestId('attachment-name-input-0-fi').first().fill('Testi liite muokattu')

    await page.getByTestId('form-submit').click()

    const attachmentNotFound = await page.getByText('Testi liite 1', { exact: true })

    expect(await attachmentNotFound.isVisible()).toBeFalsy()

    await page.getByText('Testi liite muokattu', { exact: true })
  })

  test('can create draft instruction', async ({ page }) => {
    await page.getByTestId('nameFi').fill('Testi luonnos ohje')
    await page.getByTestId('contentFi').fill('Testi luonnos sisältö')

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    // expect to be back in instruction list
    await page.getByTestId('create-ohje-button')
  })

  test('failing of attachment upload is handled correctly', async ({ page }) => {
    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje'
    })

    await page.getByTestId('form-submit').click()

    await page.getByTestId('edit-content-btn').click()

    const file = path.resolve(__dirname, '../../../server/src/test/resources/fixtures/this-will-fail.txt')
    await page.locator('#fileInput-fi').setInputFiles(file)

    const errorMessage = await page.getByTestId('file-upload-error-message').innerText()
    expect(errorMessage).toContain('this-will-fail.txt')
  })
})
