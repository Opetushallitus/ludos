package fi.oph.ludos.koodisto

data class Koodisto(
    val koodisto: String,
    val getFinnishName: Boolean = true,
    val getSwedishName: Boolean = true,
    val koodistoVersio: Int? = null
)

val koodistot = listOf(
    Koodisto("oppiaineetjaoppimaaratlops2021"),
    Koodisto("laajaalainenosaaminenlops2021"),
    Koodisto("ludostehtavatyypi"),
    Koodisto("taitotaso"),
    Koodisto("ludoslukuvuosi"),
    Koodisto("ludoslukiodiplomiaine"),
)

data class KoodistoDtoOut(
    val koodisto: String,
    val koodit: List<KoodiDtoOut>
)

data class KoodiDtoOut(
    val koodiUri: String,
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
