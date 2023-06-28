package fi.oph.ludos.instruction

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.PublishState
import java.sql.Timestamp

enum class InstructionFormat {
    HTML, PDF
}

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
    val publishState: PublishState
}

@JsonTypeName("SUKO")
data class SukoInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
) : Instruction

@JsonTypeName("PUHVI")
data class PuhviInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
) : Instruction

@JsonTypeName("LD")
data class LdInstructionDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
) : Instruction

interface InstructionOut {
    val id: Int
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class InstructionDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Instruction, InstructionOut

