package fi.oph.ludos.localization

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.ludosHttpClientBuilder
import org.apache.http.HttpStatus
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.CloseableHttpClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository

@Repository
class LocalizationRepository(
    @Value("\${ludos.opintopolkuHostname}") private val opintopolkuHostname: String,
    private val objectMapper: ObjectMapper
) {
    private val httpClient: CloseableHttpClient = ludosHttpClientBuilder().build()
    private val url = "https://${opintopolkuHostname}/lokalisointi/cxf/rest/v1/localisation?category=ludos"

    fun getLocalizationTextsFromLokalisointipalvelu(): Array<Localization> {
        val request = HttpGet(url)
        return httpClient.execute(request).use { response ->
            if (response.statusLine.statusCode != HttpStatus.SC_OK) {
                throw RuntimeException("Unexpected status code ${response.statusLine.statusCode} when fetcing localizations")
            }

            objectMapper.readValue<Array<Localization>>(response.entity.content.bufferedReader())
        }
    }

    fun getLocalizationTextsFromResourceFile(): Array<Localization> {
        val resourceStream = Thread.currentThread().contextClassLoader.getResourceAsStream("backup_data/lokalisointi.json")
        return objectMapper.readValue(resourceStream, Array<Localization>::class.java)
    }
}
