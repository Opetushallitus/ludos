package fi.oph.ludos.auth

object CspManager {
    val defaultSrc: String = "'self'"
    val scriptSrc: String = "'self'"
    val imgSrc: String = "'self'"
    val styleSrc: String = "* 'unsafe-inline'"
    val scriptSrcElem: String = "'self' 'unsafe-inline' analytiikka.opintopolku.fi"

    fun makeCSPString(): String = """
    default-src $defaultSrc;
    sript-src $scriptSrc;
    img-src $imgSrc;
    style-src $styleSrc;
    script-src-elem $scriptSrcElem;
        """.replace("\n", " ").trim()
}
