package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import fi.vm.sade.javautils.http.OphHttpRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClientException

@Component
class KayttooikeusClient : CasAuthenticationClient("kayttooikeus-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun kayttooikeudet(username: String): List<KayttooikeusServiceKayttaja> {
        val req =
            OphHttpRequest.Builder.get("https://$opintopolkuHostname/kayttooikeus-service/kayttooikeus/kayttaja?username=$username")
                .build()

        return try {
            this.httpClient.execute<List<KayttooikeusServiceKayttaja>>(req).expectedStatus(HttpStatus.OK.value())
                .mapWith { s -> mapper.readValue<List<KayttooikeusServiceKayttaja>>(s) }
                .orElseThrow { RestClientException("Got 204 or 404 code from kayttooikeus-service") }
        } catch (e: Exception) {
            logger.error("Could not get kayttooikeudet for user '$username'")
            throw e
        }
    }
}

data class KayttooikeusServiceKayttaja(
    val oidHenkilo: String,
    val username: String,
    val kayttajaTyyppi: String,
    val organisaatiot: List<Organisaatio>
)

