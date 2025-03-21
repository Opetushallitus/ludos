import { expect, test } from '@playwright/test'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'
import { Exam } from 'web/src/types'
import { fillSukoAssignmentForm } from '../../examHelpers/assignmentHelpers'
import { KERTOMISTEHTAVA, oppimaara } from 'web/src/utils/assignmentUtils'
import { tavoitetaso } from './tavoitetaso'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import fs from 'fs'
import path from 'path'
import { PrintContentModel } from '../../models/PrintContentModel'

const aihe = {
  '004': { name: 'kestävä tulevaisuus', code: '004' },
}
const laajaAlainenOsaaminen = {
  '05': { name: 'Eettisyys ja ympäristöosaaminen', code: '05' },
}

export const defaultSukoFormData = {
  nameFi: 'Verschwenden von Lebensmitteln',
  instructionFi: 'Lies den Text und erzähle den wesentlichen Inhalt auf Deutsch. Stelle dann deiner Partnerin/deinem Partener die angegebenen Fragen.',
  contentFi: [fs.readFileSync(path.join(__dirname, './suko-sisalto.fi.txt'),'utf8')],
  contentSv: [fs.readFileSync(path.join(__dirname, './suko-sisalto.sv.txt'),'utf8')],
  laajaalainenOsaaminenKoodiArvos: [ laajaAlainenOsaaminen['05'].code ],
  assignmentTypeKoodiArvo: KERTOMISTEHTAVA,
  oppimaara: {
    oppimaaraKoodiArvo: oppimaara.GERMAN_A,
    kielitarjontaKoodiArvo: null
  },
  tavoitetasoKoodiArvo: tavoitetaso['0012'].code,
  aiheKoodiArvos: [ aihe['004'].code ]
}

export interface BaseTestFixtures {
  formData: typeof defaultSukoFormData
  newSukoAssignment: AssignmentFormModel
  filledSukoAssignment: AssignmentFormModel
  publishedSukoAssignment: AssignmentContentModel
  sukoAssignmentPrintView: PrintContentModel
  printedSukoAssignment: Buffer
}

export const baseTest = test.extend<BaseTestFixtures>({
  formData: async ({}, use) => {
    await use(defaultSukoFormData)
  },
  newSukoAssignment: async ({ page }, use) => {
    const sukoPage = new AssignmentFormModel(page, Exam.SUKO)
    await sukoPage.initializeTest()
    await use(sukoPage)
  },
  filledSukoAssignment: async ({ newSukoAssignment, formData }, use) => {
    await fillSukoAssignmentForm(newSukoAssignment, formData)
    await use(newSukoAssignment);
  },
  publishedSukoAssignment: async ({ filledSukoAssignment, formData }, use) => {
    await filledSukoAssignment.submitButton.click()
    const content = new AssignmentContentModel(filledSukoAssignment.page, Exam.SUKO)

    await expect(content.header).toHaveText(formData.nameFi)
    await expect(content.publishState).toHaveText("state.julkaistu")
    await use(content);
  },
  sukoAssignmentPrintView: async ({ publishedSukoAssignment, formData  }, use) => {
    const printView = await publishedSukoAssignment.openPrintViewInNewWindow()
    await expect(printView.header).toHaveText(formData.nameFi)

    await use(printView)

    await publishedSukoAssignment.page.bringToFront()
    await printView.page.close()
  },
  printedSukoAssignment: async ({ sukoAssignmentPrintView }, use) => {
    const pdfBuffer = await sukoAssignmentPrintView.page.pdf()
    await use(pdfBuffer)
  }
})
