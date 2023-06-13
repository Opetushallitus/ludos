package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp
import java.util.*
import javax.validation.constraints.NotBlank

interface Certificate {
    val exam: Exam
    @get:NotBlank
    val nameFi: String
    @get:NotBlank
    val contentFi: String
    val publishState: PublishState
    @get:NotBlank
    val fileName: String
    @get:NotBlank
    val fileUrl: String
    @get:NotBlank
    val fileUploadDate: String
}

data class CertificateDtoIn(
    val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val contentFi: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileUrl: String,
    override val fileUploadDate: String,
) : Certificate


data class CertificateDtoOut(
    val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val contentFi: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileUrl: String,
    override val fileUploadDate: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
) : Certificate

data class FileUpload (
    val fileName: String,
    val fileUrl: String,
    val fileUploadDate: String
)
