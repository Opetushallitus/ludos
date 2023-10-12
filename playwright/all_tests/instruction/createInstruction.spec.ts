import { expect, test } from '@playwright/test'
import { fillInstructionForm } from './instructionHelpers'
import { Language, loginTestGroup, Role, setTeachingLanguage } from '../../helpers'
import path from 'path'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Instruction form tests', () => {
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

    void page.getByTestId('form-submit').click()

    const response = await page.waitForResponse(
      (response) => response.url().includes('/api/instruction') && response.ok()
    )

    const responseData = await response.json()

    instructionToUpdate = responseData.id

    await expect(page.getByTestId('notification-success')).toBeVisible()
    const header = page.getByTestId('assignment-header')

    await expect(header).toHaveText('Testi ohje')
    // check short description
    await expect(page.getByText('Testi lyhyt kuvaus', { exact: true })).toBeVisible()
    // check content
    await expect(page.getByText('Testi sisältö', { exact: true })).toBeVisible()
    // check files
    await expect(page.getByRole('link', { name: 'Testi liite 1 open_in_new' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Testi liite 2 open_in_new' })).toBeVisible()

    // change language and check that everything is correct
    await setTeachingLanguage(page, Language.SV)
    await expect(header).toHaveText('Testuppgifter')
    await expect(page.getByText('Testa kort beskrivning', { exact: true })).toBeVisible()
    await expect(page.getByText('Testa innehåll', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Testa bilaga 1 open_in_new' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Testa bilaga 2 open_in_new' })).toBeVisible()

    // update instruction
    await page.getByTestId('nav-link-suko').click()
    await page.getByTestId('tab-ohjeet').click()

    await setTeachingLanguage(page, Language.SV)

    const instructionCard = page.getByTestId(`instruction-${instructionToUpdate}`)

    await expect(instructionCard).toBeVisible()
    await expect(instructionCard.getByTestId('instruction-name')).toHaveText('Testuppgifter')
    await page.getByTestId(`instruction-${instructionToUpdate}-edit`).click()

    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje muokattu',
      nameTextSv: 'Testuppgifter redigerade',
      contentTextFi: 'Testi sisältö muokattu',
      contentTextSv: 'Testinstruktioner redigerade'
    })

    await page.getByTestId('form-update-submit').click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    const updatedInstructionHeader = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeader).toHaveText('Testi ohje muokattu')

    await setTeachingLanguage(page, Language.SV)

    const updatedInstructionHeaderSv = page.getByTestId('assignment-header')

    await expect(updatedInstructionHeaderSv).toHaveText('Testuppgifter redigerade')

    await page.getByTestId('edit-content-btn').first().click()
    // delete one finnish file
    await page.getByTestId('delete-attachment-icon-0').first().click()
    await page.getByTestId('modal-button-delete').first().click()
    // rename other finnish file
    await page.getByTestId('attachment-name-input-0-fi').first().fill('Testi liite muokattu')

    await page.getByTestId('form-update-submit').click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    await expect(page.getByRole('link', { name: 'Testi liite 1 open_in_new' })).toBeHidden()
    await expect(page.getByRole('link', { name: 'Testi liite muokattu' })).toBeVisible()
  })

  test('can create draft instruction', async ({ page }) => {
    await page.getByTestId('nameFi').fill('Testi luonnos ohje')
    await page.getByTestId('editor-content-fi').locator('div[contenteditable="true"]').fill('Testi luonnos sisältö')

    const btn = page.getByTestId('form-draft')
    await expect(btn).toHaveText('Tallenna luonnoksena')
    await btn.click()
    await expect(page.getByTestId('notification-success')).toBeVisible()
  })

  test('can cancel assignment creation', async ({ page }) => {
    const btn = page.getByTestId('form-cancel')
    await expect(btn).toHaveText('Peruuta')
    await btn.click()
    // expect to be back in instruction list
    await expect(page.getByTestId('create-ohje-button')).toBeVisible()
  })

  test('failing of attachment upload is handled correctly', async ({ page }) => {
    await fillInstructionForm({
      page,
      nameTextFi: 'Testi ohje'
    })

    await page.getByTestId('form-submit').click()
    await expect(page.getByTestId('notification-success')).toBeVisible()

    await page.getByTestId('edit-content-btn').click()

    const file = path.resolve(__dirname, '../../../server/src/main/resources/fixtures/this-will-fail.txt')
    await page.getByTestId('file-input-fi').setInputFiles(file)

    const errorMessage = await page.getByTestId('file-upload-error-message').innerText()
    expect(errorMessage).toContain('this-will-fail.txt')
  })
})
