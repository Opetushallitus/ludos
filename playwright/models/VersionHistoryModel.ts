import { expect, Page } from '@playwright/test'
import { ContentTypePluralFi, Exam } from 'web/src/types'
import { ContentModel } from './ContentModel'

export class VersionHistoryModel {
  private testVersionCount = 5

  constructor(
    readonly page: Page,
    readonly exam: Exam,
    readonly content: ContentModel,
    readonly nextVersionButton = page.getByTestId('next-version'),
    readonly previousVersionButton = page.getByTestId('previous-version'),
    readonly versionHistoryButton = page.getByTestId('version-history-btn'),
    readonly versionHistoryModal = page.getByTestId('version-history-modal'),
    readonly restoreVersionButton = page.getByTestId('restore-version'),
    readonly stopVersionBrowsingButton = page.getByTestId('stop-version-browsing')
  ) {}

  async gotoContentVersionPage(id: number, version: number) {
    await this.page.goto(
      `/${this.exam.toLowerCase()}/${ContentTypePluralFi[this.content.contentType]}/${id}/${version}`
    )
  }

  private versionHistoryItemLocator(version: number) {
    return this.page.getByTestId(`version-history-item-${version}`)
  }

  private versionHistoryShowItemLocator(version: number) {
    return this.versionHistoryItemLocator(version).getByTestId('show')
  }

  private versionHistoryRestoreItemLocator(version: number) {
    return this.versionHistoryItemLocator(version).getByTestId('restore')
  }

  async createTestVersions(testVersionCreator: (version: number) => Promise<void>) {
    // To be able to use below assert functions, testVersionCreator must satisfy these conditions:
    // 1) version 2 must have the same set of attachments than the original version from create call
    // 2) versions 3 and above must all have the same set of attachments which does not have to be the same set as before version 3
    for (let version = 2; version <= this.testVersionCount; version++) {
      await testVersionCreator(version)
    }
  }

  async assertVersionHistoryModal(id: number, name: string) {
    await this.content.goToContentPage(id)

    await expect(this.content.header).toHaveText(`${name} v5`)
    await this.versionHistoryButton.click()
    await expect(this.versionHistoryModal).toBeVisible()

    await expect(this.versionHistoryItemLocator(0)).toBeHidden()
    for (let version = 1; version <= this.testVersionCount; version++) {
      await expect(this.versionHistoryItemLocator(version)).toBeVisible()
      if (version < this.testVersionCount) {
        await expect(this.versionHistoryShowItemLocator(version)).toBeVisible()
        await expect(this.versionHistoryRestoreItemLocator(version)).toBeVisible()
      } else {
        await expect(this.versionHistoryShowItemLocator(version)).toBeHidden()
        await expect(this.versionHistoryRestoreItemLocator(version)).toBeHidden()
      }
    }

    const updaters = this.versionHistoryModal.getByTestId('updater')
    await expect(updaters).toHaveCount(this.testVersionCount)

    const updaterTexts = await updaters.allTextContents()

    updaterTexts.forEach((text) => {
      expect(text).toBe('Ludos Mocklogin')
    })

    await expect(this.versionHistoryItemLocator(this.testVersionCount + 1)).toBeHidden()
  }

  async assertVersionHistoryBrowsing(
    name: string,
    attachmentNamesBeforeVersion3: string[],
    attachmentNamesStartingFromVersion3: string[]
  ) {
    await expect(this.versionHistoryShowItemLocator(5)).toBeHidden()
    await this.versionHistoryShowItemLocator(4).click()
    await expect(this.content.header).toHaveText(`${name} v4`)
    await this.content.assertAttachments(attachmentNamesStartingFromVersion3)

    await this.nextVersionButton.click()
    await expect(this.content.header).toHaveText(`${name} v5`)
    await expect(this.nextVersionButton).toBeDisabled()
    await this.content.assertAttachments(attachmentNamesStartingFromVersion3)

    await this.previousVersionButton.click()
    await expect(this.content.header).toHaveText(`${name} v4`)
    await this.previousVersionButton.click()
    await expect(this.content.header).toHaveText(`${name} v3`)
    await this.content.assertAttachments(attachmentNamesStartingFromVersion3)

    await this.previousVersionButton.click()
    await expect(this.content.header).toHaveText(`${name} v2`)
    await this.content.assertAttachments(attachmentNamesBeforeVersion3)

    await this.previousVersionButton.click()
    await expect(this.content.header).toHaveText(`${name}`)
    await expect(this.previousVersionButton).toBeDisabled()
    await this.content.assertAttachments(attachmentNamesBeforeVersion3)
  }

  async assertVersionPage(
    id: number,
    name: string,
    attachmentNamesBeforeVersion3: string[],
    attachmentNamesAfterVersion3: string[]
  ) {
    await this.gotoContentVersionPage(id, 4)
    await expect(this.content.header).toHaveText(`${name} v4`)

    // palauta v4 versioselailupalkin napista
    await this.restoreVersionButton.click()
    await expect(this.stopVersionBrowsingButton).toBeHidden()
    await expect(this.content.header).toHaveText(`${name} v4`)
    await this.content.assertAttachments(attachmentNamesAfterVersion3)

    // palauta v2 modaalista
    await this.versionHistoryButton.click()
    await expect(this.versionHistoryModal).toBeVisible()
    await expect(this.versionHistoryItemLocator(6)).toBeVisible() // v2-palautuksen luoma versio
    await this.versionHistoryRestoreItemLocator(2).click()
    await expect(this.versionHistoryModal).toBeHidden()
    await expect(this.content.header).toHaveText(`${name} v2`)
    await this.content.assertAttachments(attachmentNamesBeforeVersion3)

    // tarkasta, että v2-palautus loi version 7
    await this.versionHistoryButton.click()
    await expect(this.versionHistoryModal).toBeVisible()
    await expect(this.versionHistoryItemLocator(7)).toBeVisible()
  }
}
