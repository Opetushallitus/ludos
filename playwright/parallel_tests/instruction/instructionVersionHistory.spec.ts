import { test } from '@playwright/test'
import { AttachmentDtoOut, Exam, InstructionDtoOut } from 'web/src/types'
import { loginTestGroup, Role } from '../../helpers'
import { InstructionContentModel } from '../../models/InstructionContentModel'
import { InstructionFormModel } from '../../models/InstructionFormModel'
import { VersionHistoryModel } from '../../models/VersionHistoryModel'

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction version history`, () => {
    test.beforeEach(async ({ page }) => await new InstructionFormModel(page, exam).showKeys())

    test('can create multiple versions of instruction, browse versions and restore', async ({ page, baseURL }) => {
      const form = new InstructionFormModel(page, exam)
      const content = new InstructionContentModel(page, exam)
      const versionHistory = new VersionHistoryModel(page, exam, content)

      await form.gotoNew()

      const instruction: InstructionDtoOut = await form.createInstructionApiCall(baseURL!, ['fixture1.pdf'])

      await versionHistory.createTestVersions(async (version) => {
        // In version 3, remove fixture1.pdf and add fixture2.pdf and fixture3.pdf
        let currentAttachments: AttachmentDtoOut[]
        if (version < 3) {
          currentAttachments = instruction.attachments
        } else if (version === 3) {
          currentAttachments = []
        } else {
          const newestInstruction: InstructionDtoOut = await form.getInstructionApiCall(baseURL!, instruction.id)
          currentAttachments = newestInstruction.attachments
        }
        await form.updateInstructionApiCall(
          baseURL!,
          instruction.id,
          JSON.stringify({ ...instruction, nameFi: `${instruction.nameFi} v${version}` }),
          currentAttachments,
          version === 3 ? ['fixture2.pdf', 'fixture3.pdf'] : []
        )
      })

      const attachmentNamesBeforeVersion3 = ['fixture1.pdf']
      const attachmentNamesStartingFromVersion3 = ['fixture2.pdf', 'fixture3.pdf']
      await versionHistory.assertVersionHistoryModal(instruction.id, instruction.nameFi)
      await versionHistory.assertVersionHistoryBrowsing(
        instruction.nameFi,
        attachmentNamesBeforeVersion3,
        attachmentNamesStartingFromVersion3
      )
      await versionHistory.assertVersionPage(
        instruction.id,
        instruction.nameFi,
        attachmentNamesBeforeVersion3,
        attachmentNamesStartingFromVersion3
      )
    })
  })
})
