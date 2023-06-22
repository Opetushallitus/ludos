package fi.oph.ludos.auth

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.apache.http.client.methods.CloseableHttpResponse
import org.apache.http.client.methods.HttpRequestBase
import org.apache.http.client.protocol.HttpClientContext
import org.apache.http.impl.client.BasicCookieStore
import org.apache.http.impl.client.CloseableHttpClient
import org.apache.http.impl.client.HttpClients
import org.apache.http.message.BasicHeader
import org.slf4j.LoggerFactory
import org.slf4j.Logger
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus

abstract class CasAuthenticationClient(val service: String) {
    private val logger: Logger = LoggerFactory.getLogger(javaClass)

    @Value("\${ludos.opintopolkuHostname}")
    lateinit var opintopolkuHostname: String

    @Value("\${ludos.service-user.username}")
    lateinit var ludosServiceUserUsername: String

    @Value("\${ludos.service-user.password}")
    lateinit var ludosServiceUserPassword: String

    val mapper = jacksonObjectMapper().apply {
        configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    }

    val httpContext = HttpClientContext().apply {
        cookieStore = BasicCookieStore()
    }

    private val authenticatedHttpClient: CloseableHttpClient = HttpClients.custom().build()

    protected fun executeRequest(req: HttpRequestBase, context: HttpClientContext): CloseableHttpResponse {
        req.setHeader(BasicHeader(CasClient.CAS_SECURITY_TICKET, getTicket(context)))

        val response = authenticatedHttpClient.execute(req, httpContext)

        return if (!isUnauthorized(response)) {
            response
        } else {
            response.close()
            logger.info("CAS redirect detected, retrying request with new ticket")
            req.setHeader(BasicHeader(CasClient.CAS_SECURITY_TICKET, refreshCasTicket(context)))
            authenticatedHttpClient.execute(req, httpContext)
        }
    }

    // Unauthorized response is returned when the provided CAS ticket is invalid
    private fun isUnauthorized(response: CloseableHttpResponse): Boolean =
        response.statusLine.statusCode == HttpStatus.UNAUTHORIZED.value()

    private fun getTicket(context: HttpClientContext): String =
        when (val maybeTicket = context.getAttribute("cas_ticket") as String?) {
            null -> refreshCasTicket(context)
            else -> maybeTicket
        }

    private fun refreshCasTicket(context: HttpClientContext): String {
        val ticket = CasClient.getTicket(
            "https://$opintopolkuHostname/cas",
            ludosServiceUserUsername,
            ludosServiceUserPassword,
            "https://$opintopolkuHostname/$service",
        )
        context.setAttribute("cas_ticket", ticket)
        return ticket
    }
}
