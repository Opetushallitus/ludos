package fi.oph.ludos.koodisto

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonValue

enum class KoodistoLanguage {
    FI,
    SV
}

enum class KoodistoName(@JsonValue val koodistoUri: String) {
    OPPIAINEET_JA_OPPIMAARAT_LOPS2021("oppiaineetjaoppimaaratlops2021"),
    KIELITARJONTA("lukiokielitarjonta"),
    LAAJA_ALAINEN_OSAAMINEN_LOPS2021("laajaalainenosaaminenlops2021"),
    TEHTAVATYYPPI_SUKO("tehtavatyyppisuko"),
    TAITOTASO("taitotaso"),
    LUDOS_LUKUVUOSI("ludoslukuvuosi"),
    LUDOS_LUKIODIPLOMI_AINE("ludoslukiodiplomiaine"),
    TEHTAVATYYPPI_PUHVI("tehtavatyyppipuhvi"),
    AIHE_SUKO("aihesuko");

    override fun toString(): String {
        return koodistoUri
    }
}

data class KoodiDtoOut(
    val koodiArvo: String,
    val nimi: String,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val tarkenteet: List<String>? = null
)

data class KoodistoPalveluKoodi(
    val koodiUri: String,
    val koodiArvo: String,
    val metadata: List<KoodistoPalveluKoodiMetadata>
)

data class KoodistoPalveluKoodiMetadata(
    val nimi: String,
    val kieli: String
)
