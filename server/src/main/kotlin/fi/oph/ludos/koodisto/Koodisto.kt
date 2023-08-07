package fi.oph.ludos.koodisto

import com.fasterxml.jackson.annotation.JsonValue

enum class KoodistoLanguage(val code: String) {
    FI("FI"),
    SV("SV")
}

enum class KoodistoName(@JsonValue val koodistoUri: String) {
    OPPIAINEET_JA_OPPIMAARAT_LOPS2021("oppiaineetjaoppimaaratlops2021"),
    LAAJA_ALAINEN_OSAAMINEN_LOPS2021("laajaalainenosaaminenlops2021"),
    TEHTAVATYYPPI_SUKO("tehtavatyyppisuko"),
    TAITOTASO("taitotaso"),
    LUDOS_LUKUVUOSI("ludoslukuvuosi"),
    LUDOS_LUKIODIPLOMI_AINE("ludoslukiodiplomiaine"),
    TEHTAVATYYPPI_PUHVI("tehtavatyyppipuhvi"),
    AIHE_SUKO("aihesuko");

    override fun toString(): String {
        return koodistoUri
    }}

data class KoodiDtoOut(
    val koodiArvo: String,
    val nimi: String,
    val kieli: String
)

data class Koodi(
    val koodiUri: String,
    val koodiArvo: String,
    val metadata: List<Metadata>
)

data class Metadata(
    val nimi: String,
    val kieli: String
)
