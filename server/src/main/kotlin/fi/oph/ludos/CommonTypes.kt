package fi.oph.ludos

import jakarta.validation.constraints.Pattern
import java.sql.Timestamp

interface ContentBase {
    @get:ValidContentName
    val nameFi: String

    @get:ValidContentName
    val nameSv: String

    val exam: Exam
    val publishState: PublishState
}

interface ContentBaseOut {
    val id: Int
    val exam: Exam
    val publishState: PublishState
    val createdAt: Timestamp
    val updatedAt: Timestamp
    val authorOid: String
    val updaterOid: String
    val updaterName: String?
}

// NOTE: This enum must match the postgres enum type language
enum class Language {
    FI,
    SV
}

interface BaseFilters {
    @get:Pattern(regexp = "^(asc|desc)\$")
    val jarjesta: String?
}

