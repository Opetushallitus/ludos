import { expect, test } from '@playwright/test'
import { createAssignment, testAssignmentIn, testEsitysNakyma } from './assignmentHelpers'
import { loginTestGroup, Role } from '../../helpers'
import { ContentType, Exam } from 'web/src/types'

loginTestGroup(test, Role.YLLAPITAJA)

test.describe('Presentation view', () => {
  test('can navigate to presentation view from content and list', async ({ page, context, baseURL }) => {
    const assignmentIn = testAssignmentIn(Exam.SUKO, 'Esitysnäkymätesti')
    const assignment = await createAssignment(context, baseURL!, assignmentIn)
    await page.goto(`/suko/${ContentType.koetehtavat}/${assignment.id}`)

    await expect(page.getByTestId('assignment-header')).toHaveText(assignmentIn.nameFi)
    await expect(page.getByTestId('assignment-metadata')).toBeVisible()

    await testEsitysNakyma(page, 'assignment-action-esitysnakyma', assignmentIn)

    await page.goto(`/suko/${ContentType.koetehtavat}`)
    await testEsitysNakyma(page, `assignment-${assignment.id}-action-esitysnakyma`, assignmentIn)
  })
})
