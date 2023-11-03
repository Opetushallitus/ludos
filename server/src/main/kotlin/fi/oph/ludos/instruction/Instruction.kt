package fi.oph.ludos.instruction

import BaseFilters
import Language
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.*
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import jakarta.validation.constraints.Pattern
import org.springframework.web.multipart.MultipartFile
import java.sql.Timestamp
import kotlin.reflect.KClass

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoInstructionDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviInstructionDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdInstructionDtoIn::class, name = "LD")
)
@AtLeastOneInstructionNameIsNotBlank
interface Instruction {
    val exam: Exam

    @get:ValidContentName
    val nameFi: String

    @get:ValidHtmlContent
    val contentFi: String

    @get:ValidContentName
    val nameSv: String

    @get:ValidHtmlContent
    val contentSv: String

    val publishState: PublishState

}

@JsonTypeName("SUKO")
data class SukoInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    @field:ValidContentDescription
    val shortDescriptionFi: String,
    @field:ValidContentDescription
    val shortDescriptionSv: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.SUKO
) : Instruction

@JsonTypeName("LD")
data class LdInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : Instruction

@JsonTypeName("PUHVI")
data class PuhviInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    @field:ValidContentDescription
    val shortDescriptionFi: String,
    @field:ValidContentDescription
    val shortDescriptionSv: String,
    override val publishState: PublishState,
    override val exam: Exam = Exam.PUHVI
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
    val exam: Exam
    val authorOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class InstructionAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: Timestamp,
    override val name: String,
    override val language: Language
) : AttachmentOut, InstructionAttachmentMetadata

data class SukoOrPuhviInstructionDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    override val publishState: PublishState,
    val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Instruction, InstructionOut

data class LdInstructionDtoOut(
    override val id: Int,
    override val exam: Exam,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    val aineKoodiArvo: String,
    val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Instruction, InstructionOut

data class InstructionFilterOptionsDtoOut(
    val aine: List<String>? = null,
)

data class InstructionListDtoOut(
    val content: List<InstructionOut>,
    val instructionFilterOptions: InstructionFilterOptionsDtoOut
)

data class InstructionFilters(
    override val jarjesta: String?,
    override val sivu: Int = 1,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aine: String?
) : BaseFilters

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AtLeastOneInstructionNameIsNotEmptyValidator::class])
annotation class AtLeastOneInstructionNameIsNotBlank(
    val message: String = "At least one of the name fields must be non-empty",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class AtLeastOneInstructionNameIsNotEmptyValidator :
    ConstraintValidator<AtLeastOneInstructionNameIsNotBlank, Instruction> {
    override fun isValid(value: Instruction, context: ConstraintValidatorContext?): Boolean {
        return value.nameFi.isNotEmpty() || value.nameSv.isNotEmpty()
    }
}
