package fi.oph.ludos.auth

import com.fasterxml.jackson.core.JacksonException
import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.http.client.methods.HttpGet
import org.apache.http.util.EntityUtils
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import software.amazon.awssdk.http.HttpStatusCode

@Component
class OppijanumerorekisteriClient: CasAuthenticationClient("oppijanumerorekisteri-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun getUserDetailsByOid(oid: String): OppijanumeroRekisteriHenkilo? {
        val req = HttpGet("https://$opintopolkuHostname/oppijanumerorekisteri-service/henkilo/$oid")
        val res = executeRequest(req, httpContext)
        if (res.statusLine.statusCode != HttpStatusCode.OK) {
            logger.warn("Could not fetch oppijanumerorekisteri details, status=${res.statusLine.statusCode}")
            return null
        }
        val body = EntityUtils.toString(res.entity)
        return try {
            mapper.readValue(body)
        } catch (e: JacksonException) {
            logger.warn("Could not deserialize OppijanumeroRekisteriHenkilo from '${body}'", e)
            null
        } catch (e: Exception) {
            logger.warn("Unexpected exception deserializing OppijanumeroRekisteriHenkilo from '${body}'", e)
            null
        }
    }
}