package fi.oph.ludos.localization

data class Localization(
    val accesscount: Int,
    val force: Boolean,
    val accessed: Long,
    val category: String,
    val created: Long,
    val createdBy: String,
    val modified: Long,
    val modifiedBy: String,
    val key: String,
    val id: Int,
    val locale: String,
    val value: String
)