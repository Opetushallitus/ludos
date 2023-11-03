package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState

interface TestCertificate {
    val exam: Exam
    val publishState: PublishState
    val nameFi: String
    val nameSv: String
}

data class TestSukoCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    val descriptionFi: String,
    val descriptionSv: String,
    override val publishState: PublishState
) : TestCertificate

data class TestPuhviCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    val descriptionFi: String,
    val descriptionSv: String,
    override val publishState: PublishState
) : TestCertificate

data class TestLdCertificateIn(
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val publishState: PublishState,
    val aineKoodiArvo: String
) : TestCertificate

data class TestCertificatesOut<T : CertificateOut>(
    val content: List<T>,
)