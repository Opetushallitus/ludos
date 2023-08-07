package fi.oph.ludos.instruction

import Language
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.AttachmentOut
import fi.oph.ludos.PublishState
import org.springframework.web.multipart.MultipartFile
import java.sql.Timestamp
import java.time.ZonedDateTime

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoInstructionDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviInstructionDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdInstructionDtoIn::class, name = "LD")
)
interface Instruction {
    val nameFi: String
    val contentFi: String
    val nameSv: String
    val contentSv: String
    val shortDescriptionFi: String
    val shortDescriptionSv: String
    val publishState: PublishState
}

@JsonTypeName("SUKO")
data class SukoInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val shortDescriptionFi: String,
    override val shortDescriptionSv: String,
    override val publishState: PublishState,
) : Instruction

@JsonTypeName("PUHVI")
data class PuhviInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val shortDescriptionFi: String,
    override val shortDescriptionSv: String,
    override val publishState: PublishState,
) : Instruction

@JsonTypeName("LD")
data class LdInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val shortDescriptionFi: String,
    override val shortDescriptionSv: String,
    override val publishState: PublishState,
) : Instruction

interface InstructionAttachmentMetadata {
    val name: String
    val language: Language
}

data class InstructionAttachmentMetadataDtoIn(
    val fileKey: String?,
    override val name: String,
    override val language: Language
) : InstructionAttachmentMetadata

data class InstructionAttachmentIn(
    val file: MultipartFile,
    val metadata: InstructionAttachmentMetadataDtoIn
)

interface InstructionOut {
    val id: Int
    val authorOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class InstructionAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: ZonedDateTime,
    override val name: String,
    override val language: Language
) : AttachmentOut, InstructionAttachmentMetadata

data class InstructionDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val shortDescriptionFi: String,
    override val shortDescriptionSv: String,
    override val publishState: PublishState,
    val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Instruction, InstructionOut

