import test from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role, setTeachingLanguage } from '../../helpers'
import { InstructionContentModel } from '../../models/InstructionContentModel'
import { assertPDFDownload } from '../../assertPdfDownload'
import { createInstruction, initializeInstructionTest } from './instructionHelpers'

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} instruction pdf download test`, () => {
    test.beforeEach(async ({ page, context, baseURL }) => {
      await initializeInstructionTest(page, exam)
      const instruction = await createInstruction(exam, context, baseURL!)

      await new InstructionContentModel(page).gotoInstructionContentPage(exam, instruction.id)
    })

    test(`${exam} can download instruction as pdf`, async ({ page }) => {
      const content = new InstructionContentModel(page)
      await assertPDFDownload(page, content.downloadPdfButtonFi, 'Testi ohje', 'Testi sisältö')
      await setTeachingLanguage(page, 'sv')
      await assertPDFDownload(page, content.downloadPdfButtonSv, 'Testuppgifter', 'Testa innehåll')
    })
  })
})
