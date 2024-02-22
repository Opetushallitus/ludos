import { expect, Page } from '@playwright/test'
import { BaseModel } from './BaseModel'
import { ContentType, Exam } from 'web/src/types'
import { AssignmentFormModel } from './AssignmentFormModel'
import { assertSuccessNotification } from '../helpers'
import { LayoutModel } from './LayoutModel'

export class AssignmentFavoriteModel extends BaseModel {
  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly form = new AssignmentFormModel(page, exam),
    readonly layout = new LayoutModel(page),
    readonly headerFavorites = page.getByTestId('header-favorites'),
    readonly addToFavoritesBtn = page.getByTestId('modal-button-add-to-favorites'),
    readonly addNewFavoriteFolderBtn = page.getByTestId('add-new-folder-btn'),
    readonly addNewFolderNameInput = page.getByTestId('add-new-folder-button-input'),
    readonly modalButtonAdd = page.getByTestId('modal-button-add'),
    readonly modalButtonDelete = page.getByTestId('modal-button-delete'),
    readonly checkBoxFavoriteRoot = page.getByTestId('option-0'),
    readonly folderActionMenuBtn = page.getByTestId('folder-action-menu-btn'),
    readonly moveFolderBtn = page.getByTestId('move-folder-btn'),
    readonly deleteFolderBtn = page.getByTestId('delete-folder-btn'),
    readonly renameFolderBtn = page.getByTestId('rename-folder-btn'),
    readonly renameFolderInput = page.getByTestId('rename-folder-input')
  ) {
    super(page, exam)
  }

  async deleteFolder(folderId: number) {
    await this.page.getByTestId(`folder-${folderId}-card`).getByTestId('folder-action-menu-btn').click()
    await this.deleteFolderBtn.click()

    await this.modalButtonDelete.click()

    await expect(this.page.getByTestId(`folder-${folderId}-card`)).toBeHidden()
  }

  async prepAssignmentGoToAssignmentList(baseURL: string): Promise<[any, number]> {
    const assignmentIn = this.form.testAssignmentIn('Suosikkitesti')
    const assignment = await this.form.assignmentApiCalls(this.page.context(), baseURL).create(assignmentIn)

    await this.page.goto(`/${this.exam.toLowerCase()}/${ContentType.koetehtavat}`)
    await this.page.getByTestId('card-list').locator('li').isVisible()

    const favoriteCountBefore = await this.favoritesCount()

    return [assignment, favoriteCountBefore]
  }

  async favoritesCount(): Promise<number> {
    await expect
      .poll(async () => await this.page.getByTestId('header-favorites-count').innerText(), {
        message: `wait for current favorite count`
      })
      .toMatch(/^\d+$/)
    return Number(await this.page.getByTestId('header-favorites-count').innerText())
  }

  async assertFavoriteCountIsEventually(expectedCount: number) {
    await expect
      .poll(async () => await this.favoritesCount(), {
        message: `make sure favorite count eventually updates to ${expectedCount}`
      })
      .toBe(expectedCount)
  }

  async assertFavoritesPage(assignment: any, favoriteCountBefore: number) {
    await this.headerFavorites.click()
    await this.goToExamTab()

    const assignmentCard = this.page.getByTestId(`assignment-list-item-${assignment.id}`)

    await expect(assignmentCard).toBeVisible()
    await assignmentCard.getByTestId('card-title').click()
    await expect(this.page.getByTestId('assignment-header')).toHaveText(assignment.nameFi)
    await this.page.goBack()
    await assignmentCard.getByTestId('suosikki').click()
    await this.checkBoxFavoriteRoot.uncheck()
    await this.addToFavoritesBtn.click()
    await assertSuccessNotification(this.page, 'assignment.notification.suosikki-muokattu')
    await expect(assignmentCard).toBeHidden()

    await this.assertFavoriteCountIsEventually(favoriteCountBefore)
  }

  async createFolder(folderName: string): Promise<number> {
    await this.addNewFavoriteFolderBtn.click()
    await this.addNewFolderNameInput.fill(folderName)
    void this.modalButtonAdd.click()

    const folderId = await this.page.waitForResponse(
      (response) => response.url().includes(`/api/assignment/favorites/${this.exam}/folder`) && response.ok()
    )

    return await folderId.json()
  }

  async goToFolderRootByBreadCrumb() {
    await this.page
      .getByRole('tabpanel')
      .getByRole('link', { name: `header.${this.exam.toLowerCase()}` })
      .click()
  }

  async goToExamTab() {
    await this.page.getByTestId(`tab-${this.exam.toLowerCase()}`).click()
  }

  async goToFolder(folderId: number) {
    await this.page.getByTestId(`folder-${folderId}-card`).getByTestId('link').click()
  }

  async doFolderSelectionInToggleFavoriteModal(toAddToFolders: number[], toRemoveFromFolders: number[]) {
    for (const folderId of toAddToFolders) {
      await this.page.getByTestId(`option-${folderId}`).check()
    }

    for (const folderId of toRemoveFromFolders) {
      await this.page.getByTestId(`option-${folderId}`).uncheck()
    }

    await this.addToFavoritesBtn.click()
  }

  async testSettingAndUnsettingAsFavorite(assignment: any, favoriteCountBefore: number, isContentPage = false) {
    const favoriteButtonLocator = this.page
      .getByTestId(isContentPage ? 'assignment-metadata' : `assignment-list-item-${assignment.id}`)
      .getByTestId('suosikki')

    await expect(favoriteButtonLocator.locator('span')).toHaveText('favorite.lisaa-suosikiksi')
    await favoriteButtonLocator.click()
    await this.addToFavoritesBtn.click()
    await assertSuccessNotification(this.page, 'assignment.notification.suosikki-muokattu')
    await expect(favoriteButtonLocator.locator('span')).toHaveText('favorite.muokkaa-suosikkeja')
    await this.assertFavoriteCountIsEventually(favoriteCountBefore + 1)

    await this.assertFavoritesPage(assignment, favoriteCountBefore)
  }

  async renameFolder(newName: string) {
    await this.folderActionMenuBtn.click()
    await this.renameFolderBtn.click()
    await this.renameFolderInput.fill(newName)
    await this.modalButtonAdd.click()
  }
}
