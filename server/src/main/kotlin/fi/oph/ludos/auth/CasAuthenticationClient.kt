package fi.oph.ludos.auth

import tools.jackson.databind.DeserializationFeature
import tools.jackson.module.kotlin.jacksonMapperBuilder
import httputils.OphHttpClient
import httputils.auth.CasAuthenticator
import jakarta.annotation.PostConstruct
import org.springframework.beans.factory.annotation.Value

abstract class CasAuthenticationClient(val service: String) {
    @Value("\${ludos.opintopolkuHostname}")
    lateinit var opintopolkuHostname: String

    @Value("\${ludos.service-user.username}")
    lateinit var ludosServiceUserUsername: String

    @Value("\${ludos.service-user.password}")
    lateinit var ludosServiceUserPassword: String

    lateinit var httpClient: OphHttpClient

    val mapper = jacksonMapperBuilder()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .build()

    @PostConstruct
    fun setup() {
        val authenticator = CasAuthenticator.Builder()
            .username(ludosServiceUserUsername)
            .password(ludosServiceUserPassword)
            .webCasUrl("https://$opintopolkuHostname/cas")
            .casServiceUrl("https://$opintopolkuHostname/$service")
            .build()

        this.httpClient =
            OphHttpClient.Builder("1.2.246.562.10.00000000001.ludos-service").authenticator(authenticator).build()
    }
}
