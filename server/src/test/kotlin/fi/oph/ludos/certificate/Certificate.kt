package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp

data class TestCertificateIn(
    val exam: Exam,
    val name: String,
    val description: String,
    val publishState: PublishState,
)

data class TestCertificateAttachmentOut(
    val fileKey: String,
    val fileName: String,
    val fileUploadDate: String,
)

data class TestCertificateOut(
    val id: Int,
    val exam: Exam,
    val name: String,
    val description: String,
    val publishState: PublishState,
    val attachment: TestCertificateAttachmentOut,
    val authorOid: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)