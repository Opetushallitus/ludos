package fi.oph.ludos.certificate

import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.datatype.jsr310.ser.ZonedDateTimeSerializer
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp
import java.time.ZonedDateTime
import javax.validation.constraints.NotBlank

interface Certificate {
    val exam: Exam
    @get:NotBlank
    val name: String
    @get:NotBlank
    val description: String
    val publishState: PublishState
    @get:NotBlank
    val fileName: String
    @get:NotBlank
    val fileKey: String
    val fileUploadDate: ZonedDateTime
}

data class CertificateDtoIn(
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileKey: String,
    @field:JsonSerialize(using = ZonedDateTimeSerializer::class)
    override val fileUploadDate: ZonedDateTime,
) : Certificate


data class CertificateDtoOut(
    val id: Int,
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileKey: String,
    override val fileUploadDate: ZonedDateTime,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
) : Certificate

data class FileUpload (
    val fileName: String,
    val fileKey: String,
    val fileUploadDate: ZonedDateTime
)
