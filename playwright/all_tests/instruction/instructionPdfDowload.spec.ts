import test from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role, setTeachingLanguage } from '../../helpers'
import { InstructionContentModel } from '../../models/InstructionContentModel'
import { assertPDFDownload } from '../../assertPdfDownload'
import { initializeInstructionTest } from './instructionHelpers'
import { InstructionFormModel } from '../../models/InstructionFormModel'

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction pdf download test`, () => {
    test.beforeEach(async ({ page, context, baseURL }) => {
      const form = new InstructionFormModel(page, exam)
      await initializeInstructionTest(page, exam)
      const instruction = await form.createInstructionApiCall(baseURL!, ['fixture1.pdf'])

      await new InstructionContentModel(page, exam).goToContentPage(instruction.id)
    })

    test(`${exam} can download instruction as pdf`, async ({ page }) => {
      const content = new InstructionContentModel(page, exam)
      await assertPDFDownload(page, content.downloadPdfButtonFi, 'Testi ohje', 'Testi sisältö')
      await setTeachingLanguage(page, 'sv')
      await assertPDFDownload(page, content.downloadPdfButtonSv, 'Testuppgifter', 'Testa innehåll')
    })
  })
})
