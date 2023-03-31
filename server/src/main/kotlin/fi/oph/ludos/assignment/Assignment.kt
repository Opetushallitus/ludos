package fi.oph.ludos.assignment

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import java.sql.Timestamp
import java.util.*

enum class ExamType {
    SUKO, PUHVI, LD
}

enum class SukoAssignmentType {
    LUKEMINEN, TEKSTIN_TIIVISTAMINEN, KESKUSTELU
}

enum class AssignmentState {
    DRAFT,
    PUBLISHED,
    ARCHIVED
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "examType")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoIn::class, name = "PUHVI")
)
interface Assignment {
    val name: String
    val content: String
    val state: AssignmentState
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoIn(
    override val name: String,
    override val content: String,
    override val state: AssignmentState,
    val assignmentType: String
) : Assignment

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoIn(
    override val name: String, override val content: String, override val state: AssignmentState
) : Assignment

@JsonTypeName("LD")
data class LdAssignmentDtoIn(
    override val name: String, override val content: String, override val state: AssignmentState
) : Assignment

interface AssignmentOut {
    val id: Int
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class SukoAssignmentDtoOut(
    override val id: Int,
    override val name: String,
    override val content: String,
    override val state: AssignmentState,
    val assignmentType: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Assignment, AssignmentOut
