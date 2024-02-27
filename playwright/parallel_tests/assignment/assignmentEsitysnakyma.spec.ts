import { expect, test } from '@playwright/test'
import { testEsitysNakyma } from '../../examHelpers/assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { ContentTypePluralFi, Exam } from 'web/src/types'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const form = new AssignmentFormModel(page, Exam.SUKO)
    const assignmentIn = form.testAssignmentIn('Esitysnäkymätesti')

    const assignment = await form.assignmentApiCalls(context, baseURL!).create(assignmentIn)
    await page.goto(`/suko/${ContentTypePluralFi.ASSIGNMENT}/${assignment.id}`)

    await expect(page.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(page.getByTestId('assignment-metadata')).toBeVisible()

    const esitysnakymaContentLocator = page.getByTestId('assignment-metadata').getByTestId('esitysnakyma')
    await testEsitysNakyma(page, esitysnakymaContentLocator, assignmentIn)

    const esitysnakymaCardLocator = page
      .getByTestId(`assignment-list-item-${assignment.id}`)
      .getByTestId('esitysnakyma')
    await page.goto(`/suko/${ContentTypePluralFi.ASSIGNMENT}`)
    await testEsitysNakyma(page, esitysnakymaCardLocator, assignmentIn)
  })
})
