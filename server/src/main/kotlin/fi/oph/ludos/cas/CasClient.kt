package fi.oph.ludos.cas

import org.apache.http.Consts
import org.apache.http.client.entity.UrlEncodedFormEntity
import org.apache.http.client.methods.HttpPost
import org.apache.http.impl.client.CloseableHttpClient
import org.apache.http.impl.client.HttpClients
import org.apache.http.message.BasicNameValuePair
import org.apache.http.util.EntityUtils

object CasClient {
    const val CAS_SECURITY_TICKET = "CasSecurityTicket"

    private val httpClient: CloseableHttpClient = HttpClients.custom().build()

    private const val CAS_URL_SUFFIX = "/v1/tickets"
    private const val SERVICE_URL_SUFFIX = "/j_spring_cas_security_check"

    fun getTicket(server: String, username: String, password: String, service: String) =
        getServiceTicket(server + CAS_URL_SUFFIX, username, password, service + SERVICE_URL_SUFFIX)

    private fun getServiceTicket(
        server: String,
        username: String,
        password: String,
        service: String,
    ): String {
        val ticketGrantingTicket = getTicketGrantingTicket(server, username, password)
        val req = HttpPost("$server/$ticketGrantingTicket")
        req.entity = UrlEncodedFormEntity(listOf(BasicNameValuePair("service", service)), Consts.UTF_8)

        return httpClient.execute(req).use { response ->
            val body = EntityUtils.toString(response.entity)
            when (response.statusLine.statusCode) {
                200 -> return@use body
                else -> throw RuntimeException("failed to get CAS service ticket, response code: ${response.statusLine.statusCode} server: $server tgt: $ticketGrantingTicket service: $service")
            }
        }
    }

    private fun getTicketGrantingTicket(
        server: String,
        username: String,
        password: String,
    ): String {
        val req = HttpPost(server)
        req.entity = UrlEncodedFormEntity(
            listOf(
                BasicNameValuePair("username", username),
                BasicNameValuePair("password", password),
            ), Consts.UTF_8
        )

        return httpClient.execute(req).use { response ->
            when (response.statusLine.statusCode) {
                201 -> {
                    EntityUtils.consume(response.entity)
                    val locationHeaders = response.getHeaders("Location")
                    if (locationHeaders != null && locationHeaders.size == 1) {
                        val responseLocation = locationHeaders[0]!!.value
                        return@use responseLocation.substringAfterLast("/")
                    }
                    throw RuntimeException("Successful ticket granting request, but no ticket found! server: $server, user: $username")
                }

                else -> throw RuntimeException("Invalid response code from CAS server: " + response.statusLine.statusCode + ", server: " + server + ", user: " + username)
            }

        }
    }
}