package fi.oph.ludos

interface Constants {
    companion object {
        const val API_PREFIX = "/api"
    }
}

enum class State {
    DRAFT, PUBLISHED, ARCHIVED
}

enum class Exam {
    SUKO, PUHVI, LD
}

enum class ContentType {
    ASSIGNMENTS, INSTRUCTIONS, CERTIFICATES
}