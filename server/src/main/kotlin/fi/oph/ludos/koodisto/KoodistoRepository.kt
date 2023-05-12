package fi.oph.ludos.koodisto

import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.http.client.HttpClient
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClientBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository

@Repository
class KoodistoRepository(
    private val objectMapper: ObjectMapper,
    @Value("\${ludos.opintopolkuHostname}") private val opintopolkuHostname: String
) {
    private val httpClient: HttpClient = HttpClientBuilder.create().build()

    private val baseUrl = "https://${opintopolkuHostname}/koodisto-service/rest/json"

    fun getKoodistot(koodisto: KoodistoName): Array<Koodi> {
        val url = "$baseUrl/${koodisto.koodistoUri}/koodi?onlyValidKoodis=true"
        val httpGet = HttpGet(url)
        val response = httpClient.execute(httpGet)
        val entity = response.entity.content.bufferedReader().use { it.readText() }

        return objectMapper.readValue(entity, Array<Koodi>::class.java)
    }
}

