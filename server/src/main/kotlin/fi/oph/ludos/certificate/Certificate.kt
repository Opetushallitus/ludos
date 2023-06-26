package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import java.sql.Timestamp
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
    @get:NotBlank
    val fileUploadDate: String
}

data class CertificateDtoIn(
    val id: Int,
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileKey: String,
    override val fileUploadDate: String,
) : Certificate


data class CertificateDtoOut(
    val id: Int,
    override val exam: Exam,
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val fileName: String,
    override val fileKey: String,
    override val fileUploadDate: String,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
) : Certificate

data class FileUpload (
    val fileName: String,
    val fileKey: String,
    val fileUploadDate: String
)
