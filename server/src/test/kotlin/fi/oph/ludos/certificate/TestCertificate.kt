package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.TestPublishState

sealed interface TestCertificate {
    val exam: Exam
    val publishState: TestPublishState
    val nameFi: String
    val nameSv: String
}

data class TestSukoCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    val descriptionFi: String,
    val descriptionSv: String,
    override val publishState: TestPublishState
) : TestCertificate

data class TestPuhviCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    val descriptionFi: String,
    val descriptionSv: String,
    override val publishState: TestPublishState
) : TestCertificate

data class TestLdCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val publishState: TestPublishState,
    val aineKoodiArvo: String
) : TestCertificate

data class TestCertificatesOut<T : CertificateOut>(
    val content: List<T>,
)