package fi.oph.ludos.assignment

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.State
import java.sql.Timestamp
import java.util.*

enum class Exam {
    SUKO, PUHVI, LD
}

enum class ExamType {
    ASSIGNMENTS, INSTRUCTIONS, CERTIFICATES
}

enum class SukoAssignmentType {
    LUKEMINEN, TEKSTIN_TIIVISTAMINEN, KESKUSTELU
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoIn::class, name = "LD")
)
interface Assignment {
    val nameFi: String
    val contentFi: String
    val nameSv: String
    val contentSv: String
    val state: State
    val examType: ExamType
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
    val assignmentType: String
) : Assignment

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
) : Assignment

@JsonTypeName("LD")
data class LdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
) : Assignment

interface AssignmentOut {
    val id: Int
    val createdAt: Timestamp
    val updatedAt: Timestamp
}

data class SukoAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
    val assignmentType: String,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Assignment, AssignmentOut

data class PuhviAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Assignment, AssignmentOut

data class LdAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp
) : Assignment, AssignmentOut

interface UpdateAssignmentDtoIn {
    val id: Int
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val state: State
    val examType: ExamType
}

data class SukoUpdateAssignmentDtoIn(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
    val assignmentType: String
) : UpdateAssignmentDtoIn

data class PuhviUpdateAssignmentDtoIn(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
) : UpdateAssignmentDtoIn

data class LdUpdateAssignmentDtoIn(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val state: State,
    override val examType: ExamType,
) : UpdateAssignmentDtoIn

data class AssignmentFilter(
    val course: String?,
    val assignmentType: String?,
    val topic: String?,
    val language: String?,
    val orderBy: String?,
    val orderDirection: String?
)
