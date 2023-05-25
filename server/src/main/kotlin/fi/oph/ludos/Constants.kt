package fi.oph.ludos

interface Constants {
    companion object {
        const val API_PREFIX = "/api"
    }
}

enum class PublishState {
    DRAFT, PUBLISHED, ARCHIVED
}

enum class Exam {
    SUKO, PUHVI, LD
}