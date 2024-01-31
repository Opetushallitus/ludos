package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import fi.vm.sade.javautils.http.OphHttpRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import java.util.*

@Component
class OppijanumerorekisteriClient : CasAuthenticationClient("oppijanumerorekisteri-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun getUserDetailsByOid(oid: String): OppijanumeroRekisteriHenkilo? {
        val req = OphHttpRequest.Builder.get("https://$opintopolkuHostname/oppijanumerorekisteri-service/henkilo/$oid")
            .build()
        return try {
            val response = httpClient.execute<OppijanumeroRekisteriHenkilo>(req)
            response.handleErrorStatus(404).with { Optional.empty() }
            response
                .expectedStatus(HttpStatus.OK.value())
                .mapWith { s -> mapper.readValue<OppijanumeroRekisteriHenkilo>(s) }
                .orElse(null)
        } catch (e: Exception) {
            logger.warn("Unexpected error getting oppijanumerorekisteri details for $oid", e)
            null
        }
    }
}