package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.http.client.methods.HttpGet
import org.apache.http.util.EntityUtils
import org.springframework.stereotype.Component

@Component
class OppijanumerorekisteriClient: CasAuthenticationClient("oppijanumerorekisteri-service") {
    fun getUserDetailsByOid(oid: String): OppijanumeroRekisteriHenkilo {
        val req = HttpGet("https://$opintopolkuHostname/oppijanumerorekisteri-service/henkilo/$oid")
        return executeRequest(req, httpContext).use { response ->
            val body = EntityUtils.toString(response.entity)
            return@use mapper.readValue(body)
        }
    }
}