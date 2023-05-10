package fi.oph.ludos.localization

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.http.HttpResponse
import org.apache.http.client.HttpClient
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClientBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository

@Repository
class LocalizationRepository(
    @Value("\${ludos.opintopolkuHostname}") private val opintopolkuHostname: String,
    private val objectMapper: ObjectMapper
) {
    private val httpClient: HttpClient = HttpClientBuilder.create().build()
    private val url = "https://${opintopolkuHostname}/lokalisointi/cxf/rest/v1/localisation?category=ludos"

    fun getLocalizationTexts(): Array<Localization> {
        val request = HttpGet(url)
        val response: HttpResponse = httpClient.execute(request)

        return objectMapper.readValue<Array<Localization>>(response.entity.content.bufferedReader())
    }
}
