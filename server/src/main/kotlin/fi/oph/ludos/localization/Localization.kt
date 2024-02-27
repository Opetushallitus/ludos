package fi.oph.ludos.localization

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import fi.oph.ludos.Language

data class Localization(
    val category: String,
    val key: String,
    val id: Int,
    @JsonDeserialize(using = LocaleDeserializer::class)
    val locale: Locale,
    val value: String
)


class LocaleDeserializer : JsonDeserializer<Locale>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Locale {
        val localeStr = p.text
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