package fi.oph.ludos.auth

object CspManager {
    private const val defaultSrc: String = "'self'"
    private const val scriptSrc: String = "'self'"
    private const val imgSrc: String = "'self'"
    private const val styleSrc: String = "'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"
    private const val scriptSrcElem: String = "'self' analytiikka.opintopolku.fi 'sha256-dsoLSEwvlqmLY1LL4xCztZmZTHKz0BHcn1xegAQKlIQ='"
    private const val connectSrc: String = "'self' analytiikka.opintopolku.fi"

    fun makeCSPString(): String = """
    default-src $defaultSrc;
    script-src $scriptSrc;
    img-src $imgSrc;
    style-src $styleSrc;
    script-src-elem $scriptSrcElem;
    connect-src $connectSrc;
        """.replace("\n", " ").trim()
}
