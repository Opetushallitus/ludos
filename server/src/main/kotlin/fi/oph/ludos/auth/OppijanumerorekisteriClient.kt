package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import httputils.OphHttpRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import java.util.*

@Component
class OppijanumerorekisteriClient : CasAuthenticationClient("oppijanumerorekisteri-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun getUserDetailsByOid(oid: String): OppijanumerorekisteriHenkilo? {
        val req = OphHttpRequest.Builder.get("https://$opintopolkuHostname/oppijanumerorekisteri-service/henkilo/$oid")
            .build()
        return try {
            val response = httpClient.execute<OppijanumerorekisteriHenkilo>(req)
            response.handleErrorStatus(404).with { Optional.empty() }
            response
                .expectedStatus(HttpStatus.OK.value())
                .mapWith { s -> mapper.readValue<OppijanumerorekisteriHenkilo>(s) }
                .orElse(null)
        } catch (e: Exception) {
            logger.warn("Unexpected error getting oppijanumerorekisteri details for $oid", e)
            null
        }
    }
}

data class OppijanumerorekisteriHenkilo(
    val etunimet: String,
    val kutsumanimi: String,
    val sukunimi: String,
    val asiointiKieli: Asiointikieli?
) {
    constructor(kayttajatiedot: Kayttajatiedot) : this(
        kayttajatiedot.etunimet ?: "-",
        kayttajatiedot.etunimet ?: "",
        kayttajatiedot.sukunimi ?: "-",
        null
    )

    fun formatName(): String {
        val etu = kutsumanimi.ifBlank { etunimet }
        return "$etu $sukunimi"
    }
}

data class Asiointikieli(val kieliKoodi: String, val kieliTyyppi: String)