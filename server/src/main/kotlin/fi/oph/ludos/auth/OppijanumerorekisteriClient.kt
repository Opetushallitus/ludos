package fi.oph.ludos.auth

import com.fasterxml.jackson.core.JacksonException
import com.fasterxml.jackson.module.kotlin.readValue
import fi.vm.sade.javautils.http.OphHttpRequest
import fi.vm.sade.javautils.http.exceptions.UnhandledHttpStatusCodeException
import org.apache.http.client.methods.HttpGet
import org.apache.http.util.EntityUtils
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClientException
import software.amazon.awssdk.http.HttpStatusCode
import java.util.*

@Component
class OppijanumerorekisteriClient: CasAuthenticationClient("oppijanumerorekisteri-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun getUserDetailsByOid(oid: String): OppijanumeroRekisteriHenkilo? {
        val req = OphHttpRequest.Builder.get("https://$opintopolkuHostname/oppijanumerorekisteri-service/henkilo/$oid").build()
        return try {
            httpClient.execute<OppijanumeroRekisteriHenkilo>(req)
                .expectedStatus(HttpStatus.OK.value())
                .mapWith { s -> mapper.readValue<OppijanumeroRekisteriHenkilo>(s)}
                .orElseThrow { RestClientException("Got 204 or 404 code from oppijanumerorekisteri") }
        } catch (e: Exception) {
            logger.warn("Unexpected error getting oppijanumerorekisteri details for $oid", e)
            null
        }
    }
}