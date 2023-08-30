package fi.oph.ludos.koodisto

import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.http.HttpStatus
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

    fun getKoodistoFromKoodistopalvelu(koodisto: KoodistoName): Array<Koodi> {
        val url = "$baseUrl/${koodisto.koodistoUri}/koodi?onlyValidKoodis=true"
        val httpGet = HttpGet(url)
        val response = httpClient.execute(httpGet)

        if (response.statusLine.statusCode != HttpStatus.SC_OK) {
            throw RuntimeException("Unexpected status code ${response.statusLine.statusCode} when fetcing koodisto ${koodisto}")
        }

        return objectMapper.readValue(response.entity.content.bufferedReader(), Array<Koodi>::class.java)
    }

    fun getKoodistoFromResource(koodisto: KoodistoName): Array<Koodi> {
        val resourceStream = Thread.currentThread().contextClassLoader.getResourceAsStream("backup_data/koodisto_${koodisto.koodistoUri}.json")
        return objectMapper.readValue(resourceStream, Array<Koodi>::class.java)
    }

}
