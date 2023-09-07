package fi.oph.ludos.certificate

import fi.oph.ludos.*
import java.sql.Timestamp
import java.time.ZonedDateTime
import jakarta.validation.constraints.NotBlank

interface Certificate {
    val exam: Exam
    @get:NotBlank
    @get:ValidContentName
    val name: String
    @get:ValidContentDescription
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
    val attachment: CertificateAttachmentDtoOut,
    val authorOid: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
) : Certificate

data class CertificateAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: ZonedDateTime,
): AttachmentOut