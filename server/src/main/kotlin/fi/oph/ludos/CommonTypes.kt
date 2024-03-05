package fi.oph.ludos

import jakarta.validation.constraints.Pattern
import java.sql.Timestamp

enum class PublishState {
    DRAFT, PUBLISHED, ARCHIVED, DELETED
}

enum class Exam {
    SUKO, PUHVI, LD
}

enum class ContentType {
    ASSIGNMENT, INSTRUCTION, CERTIFICATE
}

interface ContentBase {
    @get:ValidContentName
    val nameFi: String

    @get:ValidContentName
    val nameSv: String

    val exam: Exam
    val contentType: ContentType
    val publishState: PublishState
}

interface ContentOutFields {
    val id: Int
    val createdAt: Timestamp
    val updatedAt: Timestamp
    val authorOid: String
    val updaterOid: String
    val updaterName: String?
    val version: Int
}

data class ContentOutFieldsImpl(
    override val id: Int,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val version: Int
) : ContentOutFields

interface ContentBaseOut : ContentBase, ContentOutFields

// NOTE: This enum must match the postgres enum type language
enum class Language {
    FI,
    SV
}

interface BaseFilters {
    @get:Pattern(regexp = "^(asc|desc)\$")
    val jarjesta: String?
}

