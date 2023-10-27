package fi.oph.ludos.certificate

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.*
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import jakarta.validation.constraints.NotBlank
import java.sql.Timestamp
import java.time.ZonedDateTime

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoCertificateDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviCertificateDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdCertificateDtoIn::class, name = "LD")
)
interface Certificate {
    val exam: Exam

    @get:NotBlank
    @get:ValidContentName
    val name: String
    val publishState: PublishState
}

interface SukoOrPuhviCertificate : Certificate {
    @get:NotBlank
    @get:ValidContentDescription
    val description: String
}

@JsonTypeName("SUKO")
data class SukoCertificateDtoIn(
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.SUKO
) : SukoOrPuhviCertificate

@JsonTypeName("LD")
data class LdCertificateDtoIn(
    override val name: String,
    override val publishState: PublishState,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : Certificate

@JsonTypeName("PUHVI")
data class PuhviCertificateDtoIn(
    override val name: String,
    override val description: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.PUHVI
) : SukoOrPuhviCertificate

interface CertificateOut : Certificate {
    val id: Int
    override val exam: Exam
    override val name: String
    override val publishState: PublishState
    val attachment: CertificateAttachmentDtoOut
    val authorOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class SukoOrPuhviCertificateDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val name: String,
    val description: String,
    override val publishState: PublishState,
    override val attachment: CertificateAttachmentDtoOut,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : CertificateOut

data class LdCertificateDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val name: String,
    override val publishState: PublishState,
    override val attachment: CertificateAttachmentDtoOut,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    val aineKoodiArvo: String
) : CertificateOut


data class CertificateAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: ZonedDateTime,
) : AttachmentOut

data class CertificatesOut(
    val content: List<CertificateOut>
)