package fi.oph.ludos.koodisto

enum class Language(val code: String) {
    FI("FI"),
    SV("SV")
}

data class Koodisto(
    val koodisto: String,
)

val ludosKoodistos = listOf(
    Koodisto("oppiaineetjaoppimaaratlops2021"),
    Koodisto("laajaalainenosaaminenlops2021"),
    Koodisto("ludostehtavatyypi"),
    Koodisto("taitotaso"),
    Koodisto("ludoslukuvuosi"),
    Koodisto("ludoslukiodiplomiaine"),
)

data class KoodistoWithKoodit(
    val name: String,
    val koodit: List<KoodiDtoOut>
)

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
