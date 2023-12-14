package fi.oph.ludos.certificate

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.*
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.sql.Timestamp

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoCertificateDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviCertificateDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdCertificateDtoIn::class, name = "LD")
)
interface Certificate : ContentBase

@JsonTypeName("SUKO")
data class SukoCertificateDtoIn(
    @field:NotBlank
    @field:ValidContentName
    override val nameFi: String,
    @field:Size(min = 0, max = 0)
    override val nameSv: String,
    @field:NotBlank
    @field:ValidContentDescription
    val descriptionFi: String,
    @field:Size(min = 0, max = 0)
    val descriptionSv: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.SUKO
) : Certificate {
    constructor(out: SukoCertificateDtoOut) : this(
        out.nameFi,
        out.nameSv,
        out.descriptionFi,
        out.descriptionSv,
        out.publishState,
        out.exam
    )
}

@JsonTypeName("LD")
data class LdCertificateDtoIn(
    @field:NotBlank
    @field:ValidContentName
    override val nameFi: String,
    @field:NotBlank
    @field:ValidContentName
    override val nameSv: String,
    override val publishState: PublishState,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : Certificate {
    constructor(out: LdCertificateDtoOut) : this(
        out.nameFi,
        out.nameSv,
        out.publishState,
        out.aineKoodiArvo,
        out.exam
    )
}

@JsonTypeName("PUHVI")
data class PuhviCertificateDtoIn(
    @field:NotBlank
    @field:ValidContentName
    override val nameFi: String,
    @field:NotBlank
    @field:ValidContentName
    override val nameSv: String,
    @field:NotBlank
    @field:ValidContentDescription
    val descriptionFi: String,
    @field:NotBlank
    @field:ValidContentDescription
    val descriptionSv: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.PUHVI
) : Certificate {
    constructor(out: PuhviCertificateDtoOut) : this(
        out.nameFi,
        out.nameSv,
        out.descriptionFi,
        out.descriptionSv,
        out.publishState,
        out.exam
    )
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoCertificateDtoOut::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviCertificateDtoOut::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdCertificateDtoOut::class, name = "LD")
)
sealed interface CertificateOut : ContentBaseOut, Certificate {
    val attachmentFi: CertificateAttachmentDtoOut
    val attachmentSv: CertificateAttachmentDtoOut
    val version: Int
}

@JsonTypeName("SUKO")
data class SukoCertificateDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val publishState: PublishState,
    override val attachmentFi: CertificateAttachmentDtoOut,
    override val attachmentSv: CertificateAttachmentDtoOut,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val version: Int,
    val descriptionFi: String,
    val descriptionSv: String,
    override val exam: Exam = Exam.SUKO
) : CertificateOut

@JsonTypeName("LD")
data class LdCertificateDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val publishState: PublishState,
    override val attachmentFi: CertificateAttachmentDtoOut,
    override val attachmentSv: CertificateAttachmentDtoOut,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val version: Int,
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : CertificateOut

@JsonTypeName("PUHVI")
data class PuhviCertificateDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val publishState: PublishState,
    override val attachmentFi: CertificateAttachmentDtoOut,
    override val attachmentSv: CertificateAttachmentDtoOut,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val version: Int,
    val descriptionFi: String,
    val descriptionSv: String,
    override val exam: Exam = Exam.PUHVI
) : CertificateOut

data class CertificateAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: Timestamp,
) : AttachmentOut

data class CertificatesOut(
    val content: List<CertificateOut>
)

data class CertificateFilters(
    override val jarjesta: String?
) : BaseFilters