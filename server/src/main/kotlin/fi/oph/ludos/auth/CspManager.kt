package fi.oph.ludos.auth

object CspManager {
    val defaultSrc: String = "'self'"
    val scriptSrc: String = "'self'"
    val imgSrc: String = ""
    val styleSrc: String = ""

    fun makeCSPString(): String = "default-src $defaultSrc; sript-src $scriptSrc; img-src $imgSrc; style-src $styleSrc"
}
