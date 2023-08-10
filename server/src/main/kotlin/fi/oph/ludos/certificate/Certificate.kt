package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp
import java.time.ZonedDateTime
import javax.validation.constraints.NotBlank

interface Certificate {
    val exam: Exam
    @get:NotBlank
    val name: String
    val description: String
    val publishState: PublishState
}

data class CertificateDtoIn(
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
) : Certificate

data class CertificateDtoOut(
    val id: Int,
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    val attachment: CertificateAttachment,
    val authorOid: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
) : Certificate

data class CertificateAttachment (
    val fileKey: String,
    val fileName: String,
    val fileUploadDate: ZonedDateTime
)
