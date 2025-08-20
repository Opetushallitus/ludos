import { expect, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role } from '../../helpers'
import { AssignmentFavoriteModel } from '../../models/AssignmentFavoriteModel'
import { FormModel } from '../../models/FormModel'

loginTestGroup(test, Role.YLLAPITAJA)
test.describe.configure({ mode: 'serial' })
Object.values(Exam).forEach((exam) => {
  test.describe('Assignment favorites', () => {
    test.beforeEach(async ({ page }) => await new FormModel(page, exam).showKeys())

    test(`Can favorite an ${exam} assignment from list`, async ({ page, baseURL }) => {
      const favorite = new AssignmentFavoriteModel(page, exam)

      const [assignment, favoriteCountBefore] = await favorite.prepAssignmentGoToAssignmentList(baseURL!)
      await favorite.testSettingAndUnsettingAsFavorite(assignment, favoriteCountBefore)
    })

    test(`Can favorite an ${exam} assignment from assignment content page`, async ({ page, baseURL }) => {
      const favorite = new AssignmentFavoriteModel(page, exam)

      const [assignment, favoriteCountBefore] = await favorite.prepAssignmentGoToAssignmentList(baseURL!)
      await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('card-title').click()
      await expect(favorite.headerFavorites).toBeVisible()
      await favorite.testSettingAndUnsettingAsFavorite(assignment, favoriteCountBefore, true)
    })

    test(`Can create new ${exam} folder and add assignment to it`, async ({ page, baseURL }) => {
      const favorite = new AssignmentFavoriteModel(page, exam)

      const newFolderName = `test-folder ${exam}`

      const [assignment, _] = await favorite.prepAssignmentGoToAssignmentList(baseURL!)

      await favorite.headerFavorites.click()

      const folderId = await favorite.createFolder(newFolderName)

      await favorite.layout.navHeaderGoToPageByExam(exam)
      await page.getByTestId(`assignment-list-item-${assignment.id}`).getByTestId('suosikki').click()

      await page.getByTestId('radio-1').click()
      await page.getByTestId(`option-${folderId}`).click()
      await favorite.addToFavoritesBtn.click()

      await favorite.headerFavorites.click()

      await expect(page.getByRole('link', { name: newFolderName }).first()).toBeVisible()
      await favorite.goToFolder(folderId)
      await expect(page.getByTestId(`assignment-list-item-${assignment.id}`)).toBeVisible()
      await expect(page.getByTestId('card-title')).toContainText(assignment.nameFi)

      await favorite.goToFolderRootByBreadCrumb()

      await favorite.deleteFolder(folderId)
    })

    test(`Can move ${exam} assignments between folders`, async ({ page, baseURL }) => {
      const favorite = new AssignmentFavoriteModel(page, exam)

      const [assignment, _] = await favorite.prepAssignmentGoToAssignmentList(baseURL!)

      const assignmentCard = page.getByTestId(`assignment-list-item-${assignment.id}`)
      const assignmentCardFavoriteBtn = assignmentCard.getByTestId('suosikki')
      const assignmentCardFolderBtn = assignmentCard.getByTestId('folder')

      await favorite.layout.navHeaderGoToPageByExam(exam)
      await assignmentCardFavoriteBtn.click()
      await favorite.addToFavoritesBtn.click()

      await favorite.headerFavorites.click()

      const folderId = await favorite.createFolder('folder 1')
      const folderId2 = await favorite.createFolder('folder 2')

      await assignmentCardFolderBtn.click()
      await favorite.doFolderSelectionInToggleFavoriteModal([folderId], [0])

      await page.getByTestId(`folder-${folderId}-card`).getByTestId('link').click()
      await expect(assignmentCard).toBeVisible()

      await assignmentCardFolderBtn.click()
      await favorite.doFolderSelectionInToggleFavoriteModal([folderId2], [folderId])

      await expect(assignmentCard).toBeHidden()

      await favorite.goToExamTab()

      await page.getByTestId(`folder-${folderId2}-card`).getByTestId('link').click()
      await expect(assignmentCard).toBeVisible()

      await favorite.goToFolderRootByBreadCrumb()
      await favorite.deleteFolder(folderId)
      await favorite.deleteFolder(folderId2)
    })

    test(`Can rename ${exam} folder`, async ({ page }) => {
      const favorite = new AssignmentFavoriteModel(page, exam)

      await favorite.headerFavorites.click()
      await favorite.goToExamTab()

      const folderId = await favorite.createFolder('rename me!')
      await favorite.goToFolder(folderId)

      await favorite.renameFolder('I am renamed!')

      await favorite.goToFolderRootByBreadCrumb()

      await expect(favorite.page.getByTestId(`folder-${folderId}-card`).getByTestId('link')).toContainText(
        'I am renamed!'
      )

      await favorite.deleteFolder(folderId)
    })
  })
})
