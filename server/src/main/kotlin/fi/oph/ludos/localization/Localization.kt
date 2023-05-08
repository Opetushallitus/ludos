package fi.oph.ludos.localization

data class Localization(
    val category: String,
    val key: String,
    val id: Int,
    val locale: String,
    val value: String
)