package fi.oph.ludos.auth

object CspManager {
    private const val defaultSrc: String = "'self'"
    private const val scriptSrc: String = "'self'"
    private const val imgSrc: String = "'self'"
    private const val styleSrc: String = "'self' 'unsafe-inline'"
    private const val scriptSrcElem: String = "'self' 'unsafe-inline' analytiikka.opintopolku.fi"

    fun makeCSPString(): String = """
    default-src $defaultSrc;
    sript-src $scriptSrc;
    img-src $imgSrc;
    style-src $styleSrc;
    script-src-elem $scriptSrcElem;
        """.replace("\n", " ").trim()
}
