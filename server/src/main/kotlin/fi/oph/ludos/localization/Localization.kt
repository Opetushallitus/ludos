package fi.oph.ludos.localization

import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.annotation.JsonDeserialize
import fi.oph.ludos.Language

data class Localization(
    val category: String,
    val key: String,
    val id: Int,
    @param:JsonDeserialize(using = LocaleDeserializer::class)
    val locale: Locale,
    val value: String
)


class LocaleDeserializer : ValueDeserializer<Locale>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Locale {
        val localeStr = p.string
        return Locale.fromLocaleString(localeStr) ?: throw IllegalArgumentException("Unknown locale: $localeStr")
    }
}

enum class Locale(val locale: String) {
    FI("fi"), SV("sv");

    fun toLanguage() = when (this) {
        FI -> Language.FI
        SV -> Language.SV
    }

    companion object {
        fun fromLocaleString(localeStr: String): Locale? = entries.firstOrNull { it.locale == localeStr }
    }
}