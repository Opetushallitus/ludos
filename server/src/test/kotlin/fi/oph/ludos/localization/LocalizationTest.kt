package fi.oph.ludos.localization

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import tools.jackson.module.kotlin.jacksonObjectMapper
import tools.jackson.module.kotlin.readValue

class LocalizationTest {
    @Test
    fun `unsupported locales deserialize to null instead of failing`() {
        val json = """[
            {"category":"ludos","key":"a","id":1,"locale":"fi","value":"A"},
            {"category":"ludos","key":"a","id":2,"locale":"en","value":"A"}
        ]"""

        val localizations = jacksonObjectMapper().readValue<Array<Localization>>(json)

        assertEquals(listOf(Locale.FI, null), localizations.map { it.locale })
    }
}
