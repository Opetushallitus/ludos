package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp

interface TestCertificate {
    val exam: Exam
    val name: String
    val publishState: PublishState
}

data class TestSukoOrPuhviCertificateIn(
    override val exam: Exam,
    override val name: String,
    val description: String,
    override val publishState: PublishState
) : TestCertificate

data class TestLdCertificateIn(
    override val exam: Exam,
    override val name: String,
    override val publishState: PublishState,
    val aineKoodiArvo: String
) : TestCertificate

data class TestCertificateAttachmentOut(
    val fileKey: String,
    val fileName: String,
    val fileUploadDate: String,
)

interface TestCertificateOut {
    val id: Int
    val exam: Exam
    val name: String
    val publishState: PublishState
    val attachment: TestCertificateAttachmentOut
    val authorOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class TestSukoOrPuhviCertificateDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val name: String,
    val description: String,
    override val publishState: PublishState,
    override val attachment: TestCertificateAttachmentOut,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : TestCertificateOut

data class TestLdCertificateDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val name: String,
    override val publishState: PublishState,
    override val attachment: TestCertificateAttachmentOut,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    val aineKoodiArvo: String
) : TestCertificateOut

data class TestCertificatesOut<T : TestCertificateOut>(
    val content: List<T>
)