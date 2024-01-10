package fi.oph.ludos.instruction

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
    JsonSubTypes.Type(value = LdInstructionDtoIn::class, name = "LD"),
    JsonSubTypes.Type(value = PuhviInstructionDtoIn::class, name = "PUHVI")
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

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoInstructionDtoOut::class, name = "SUKO"),
    JsonSubTypes.Type(value = LdInstructionDtoOut::class, name = "LD"),
    JsonSubTypes.Type(value = PuhviInstructionDtoOut::class, name = "PUHVI")
)
interface InstructionOut : Instruction {
    val id: Int
    val authorOid: String
    val updaterOid: String
    val createdAt: Timestamp
    val updatedAt: Timestamp
    val attachments: List<InstructionAttachmentDtoOut>
}

@JsonTypeName("SUKO")
data class SukoInstructionDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    override val publishState: PublishState,
    override val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val updaterOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val exam: Exam = Exam.SUKO
) : InstructionOut

@JsonTypeName("LD")
data class LdInstructionDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    val aineKoodiArvo: String,
    override val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val updaterOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val exam: Exam = Exam.LD
) : InstructionOut

@JsonTypeName("PUHVI")
data class PuhviInstructionDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    val shortDescriptionFi: String,
    val shortDescriptionSv: String,
    override val publishState: PublishState,
    override val attachments: List<InstructionAttachmentDtoOut>,
    override val authorOid: String,
    override val updaterOid: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val exam: Exam = Exam.PUHVI
) : InstructionOut

sealed interface InstructionFilterOptions

data class SukoInstructionFilterOptionsDtoOut(val dummy: Int = 0) : InstructionFilterOptions

data class LdInstructionFilterOptionsDtoOut(
    val aine: List<String>? = null
) : InstructionFilterOptions

data class PuhviInstructionFilterOptionsDtoOut(val dummy: Int = 0) : InstructionFilterOptions

data class InstructionListDtoOut<I : InstructionOut, O : InstructionFilterOptions>(
    val content: List<I>,
    val instructionFilterOptions: O
)

typealias SukoInstructionListDtoOut = InstructionListDtoOut<SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>
typealias LdInstructionListDtoOut = InstructionListDtoOut<LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>
typealias PuhviInstructionListDtoOut = InstructionListDtoOut<PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>

data class InstructionAttachmentDtoOut(
    override val fileKey: String,
    override val fileName: String,
    override val fileUploadDate: Timestamp,
    override val name: String,
    override val language: Language
) : AttachmentOut, InstructionAttachmentMetadata

sealed interface InstructionBaseFilters : BaseFilters {
    override val jarjesta: String?
}

data class SukoInstructionFilters(
    override val jarjesta: String? = null
) : InstructionBaseFilters

data class LdInstructionFilters(
    override val jarjesta: String? = null,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aine: String? = null
) : InstructionBaseFilters

data class PuhviInstructionFilters(
    override val jarjesta: String? = null
) : InstructionBaseFilters

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
