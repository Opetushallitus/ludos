import { test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role } from '../../helpers'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { FormModel } from '../../models/FormModel'
import { VersionHistoryModel } from '../../models/VersionHistoryModel'

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} assignment version history`, () => {
    test.beforeEach(async ({ page }) => await new FormModel(page, exam).showKeys())

    test('can create multiple versions of assignment, browse versions and restore', async ({
      page,
      context,
      baseURL
    }) => {
      const form = new AssignmentFormModel(page, exam)
      const content = new AssignmentContentModel(page, exam)
      const versionHistory = new VersionHistoryModel(page, exam, content)

      const apiCalls = form.assignmentApiCalls(context, baseURL!)

      const assignmentIn = form.testAssignmentIn('Versiotesti')
      const assignment = await apiCalls.create(assignmentIn)

      await versionHistory.createTestVersions(async (version) => {
        await apiCalls.update(
          assignment.id,
          JSON.stringify({ ...assignment, nameFi: `${assignment.nameFi} v${version}` })
        )
      })
      await versionHistory.assertVersionHistoryModal(assignment.id, assignment.nameFi)
      await versionHistory.assertVersionHistoryBrowsing(assignment.nameFi, [], [])
      await versionHistory.assertVersionPage(assignment.id, assignment.nameFi, [], [])
    })
  })
})
