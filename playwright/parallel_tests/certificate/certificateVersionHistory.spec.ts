import { expect, test } from '@playwright/test'
import { Exam } from 'web/src/types'
import { loginTestGroup, Role } from '../../helpers'
import { CertificateContentModel } from '../../models/CertificateContentModel'
import { CertificateFormModel } from '../../models/CertificateFormModel'
import { VersionHistoryModel } from '../../models/VersionHistoryModel'

loginTestGroup(test, Role.YLLAPITAJA)
Object.values(Exam).forEach((exam) => {
  test.describe(`${exam} certificate version history`, () => {
    test.beforeEach(async ({ page }) => await new CertificateFormModel(page, exam).showKeys())

    test('can create multiple versions of certificate, browse versions and restore', async ({ page, baseURL }) => {
      const form = new CertificateFormModel(page, exam)
      const content = new CertificateContentModel(page, exam)
      const versionHistory = new VersionHistoryModel(page, exam, content)

      const attachmentNameBeforeVersion3 = 'fixture1.pdf'
      const attachmentNameStartingFromVersion3 = 'fixture2.pdf'

      const certificateIn = form.createFormData('submit')
      const certificate = await form.createCertificateApiCall(baseURL!, certificateIn, attachmentNameBeforeVersion3)

      await content.goToContentPage(certificate.id)
      await expect(content.header).toHaveText(certificate.nameFi)

      await versionHistory.createTestVersions(async (version) => {
        const updateCertificateIn = form.createFormData('submit')
        const newNameFi = `${updateCertificateIn.nameFi} v${version}`
        await form.updateCertificateApiCall(
          baseURL!,
          certificate.id,
          { ...updateCertificateIn, nameFi: newNameFi },
          version < 3 ? attachmentNameBeforeVersion3 : attachmentNameStartingFromVersion3
        )
      })

      await versionHistory.assertVersionHistoryModal(certificate.id, certificate.nameFi)
      await versionHistory.assertVersionHistoryBrowsing(
        certificate.nameFi,
        [attachmentNameBeforeVersion3],
        [attachmentNameStartingFromVersion3]
      )
      await versionHistory.assertVersionPage(
        certificate.id,
        certificate.nameFi,
        [attachmentNameBeforeVersion3],
        [attachmentNameStartingFromVersion3]
      )
    })
  })
})
