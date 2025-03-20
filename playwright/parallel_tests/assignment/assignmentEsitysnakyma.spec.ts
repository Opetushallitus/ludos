import { expect, test } from '@playwright/test'
import { testEsitysNakyma } from '../../examHelpers/assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { ContentType, ContentTypePluralFi, Exam } from 'web/src/types'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import { baseTest, BaseTestFixtures, defaultSukoFormData } from '../fixtures/suko'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const form = new AssignmentFormModel(page, Exam.SUKO)
    const content = new AssignmentContentModel(page, Exam.SUKO)
    const assignmentIn = form.testAssignmentIn('Esitysnäkymätesti')

    const assignment = await form.assignmentApiCalls(context, baseURL!).create(assignmentIn)
    await form.goToContentPage(ContentType.ASSIGNMENT, assignment.id)

    await expect(form.formHeader).toHaveText(assignmentIn.nameFi)
    await expect(content.metadata).toBeVisible()

    const esitysnakymaContentLocator = content.metadata.getByTestId('esitysnakyma')
    await testEsitysNakyma(page, esitysnakymaContentLocator, assignmentIn)

    const esitysnakymaCardLocator = page
      .getByTestId(`assignment-list-item-${assignment.id}`)
      .getByTestId('esitysnakyma')
    await page.goto(`/suko/${ContentTypePluralFi.ASSIGNMENT}`)
    await testEsitysNakyma(page, esitysnakymaCardLocator, assignmentIn)
  })
})

const printViewTest = baseTest.extend<BaseTestFixtures>({
  formData: async ({}, use) => {
    await use({
      ...defaultSukoFormData,
      nameFi: `Tulostusnäkymä: ${defaultSukoFormData.nameFi}`
    })
  },
})

printViewTest('Print view', async ({ sukoAssignmentPrintView }) => {
  await test.step('metadata is visible', async () => {
    await expect(sukoAssignmentPrintView.metadata).toBeVisible()
  })
})

