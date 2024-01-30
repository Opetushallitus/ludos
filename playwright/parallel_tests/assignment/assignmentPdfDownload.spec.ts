import test from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role, setTeachingLanguage } from '../../helpers'
import { AssignmentContentListModel } from '../../models/AssignmentContentListModel'
import { AssignmentContentModel } from '../../models/AssignmentContentModel'
import { assertPDFDownload } from '../../assertPdfDownload'
import { AssignmentFormModel } from '../../models/AssignmentFormModel'

const fileTitle = (exam: Exam) => `Testitehtävä ${exam} PDF download`
const expectedFileTitle = (exam: Exam, lang: 'fi' | 'sv') => `${fileTitle(exam)} nimi ${lang}`
const expectedPdfContent = (exam: Exam) => `${fileTitle(exam)} sis`

async function assertContentPagePdfDownload(content: AssignmentContentModel) {
  await assertPDFDownload(
    content.page,
    content.downloadPdfButtonFi.first(),
    expectedFileTitle(content.exam, 'fi'),
    expectedPdfContent(content.exam)
  )
  if (content.exam !== Exam.SUKO) {
    await setTeachingLanguage(content.page, 'sv')
    await assertPDFDownload(
      content.page,
      content.downloadPdfButtonSv.first(),
      expectedFileTitle(content.exam, 'sv'),
      expectedPdfContent(content.exam)
    )
    await setTeachingLanguage(content.page, 'fi')
  }
}

async function assertContentListPdfDownload(assignmentId: number, contentList: AssignmentContentListModel) {
  await assertPDFDownload(
    contentList.page,
    contentList.page.getByTestId(`assignment-list-item-${assignmentId}`).getByTestId('pdf-download-button-fi'),
    expectedFileTitle(contentList.exam, 'fi'),
    expectedPdfContent(contentList.exam)
  )
  if (contentList.exam !== Exam.SUKO) {
    await setTeachingLanguage(contentList.page, 'sv')
    await assertPDFDownload(
      contentList.page,
      contentList.page.getByTestId(`assignment-list-item-${assignmentId}`).getByTestId('pdf-download-button-sv'),
      expectedFileTitle(contentList.exam, 'sv'),
      expectedPdfContent(contentList.exam)
    )
  }
}

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} assignment pdf download tests`, () => {
    test(`${exam} assignment pdf download test`, async ({ page, baseURL }) => {
      const form = new AssignmentFormModel(page, exam)
      const content = new AssignmentContentModel(page, exam)
      const contentList = new AssignmentContentListModel(page, exam)

      await form.showKeys()

      const assignmentIn = form.testAssignmentIn(fileTitle(exam))
      const assignment = await form.assignmentApiCalls(page.context(), baseURL!).create(assignmentIn)

      await content.goToContentPage(assignment.id)
      await assertContentPagePdfDownload(content)
      await content.returnButton.click()

      await assertContentListPdfDownload(assignment.id, contentList)
    })
  })
})
