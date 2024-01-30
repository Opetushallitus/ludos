import { expect, test } from '@playwright/test'
import { testEsitysNakyma } from '../../examHelpers/assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { ContentType, Exam } from 'web/src/types'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const form = new AssignmentFormModel(page, Exam.SUKO)
    const assignmentIn = form.testAssignmentIn('Esitysnäkymätesti')

    const assignment = await form.assignmentApiCalls(context, baseURL!).create(assignmentIn)
    await page.goto(`/suko/${ContentType.koetehtavat}/${assignment.id}`)

    await expect(page.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(page.getByTestId('assignment-metadata')).toBeVisible()

    await testEsitysNakyma(page, 'assignment-action-esitysnakyma', assignmentIn)

    await page.goto(`/suko/${ContentType.koetehtavat}`)
    await testEsitysNakyma(page, `assignment-${assignment.id}-action-esitysnakyma`, assignmentIn)
  })
})
