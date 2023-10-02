package fi.oph.ludos.koodisto

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.ludosHttpClientBuilder
import org.apache.http.HttpStatus
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.CloseableHttpClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Repository
import java.io.InputStream
import java.nio.file.Paths

interface KoodistoRepository {
    fun getKoodisto(koodisto: KoodistoName): List<KoodistoPalveluKoodi>
    fun getAlakoodit(koodistoPalveluKoodi: KoodistoPalveluKoodi): List<KoodistoPalveluKoodi>
}

@Repository
class HttpKoodistoRepository(
    private val objectMapper: ObjectMapper,
    @Value("\${ludos.opintopolkuHostname}") private val opintopolkuHostname: String
) : KoodistoRepository {
    private val httpClient: CloseableHttpClient = ludosHttpClientBuilder().build()

    private val baseUrl = "https://${opintopolkuHostname}/koodisto-service/rest/json"

    private fun getKoodiListFromKoodistoPalvelu(urlPath: String, description: String): List<KoodistoPalveluKoodi> {
        val httpGet = HttpGet("$baseUrl$urlPath")
        return httpClient.execute(httpGet).use { response ->
            if (response.statusLine.statusCode != HttpStatus.SC_OK) {
                throw RuntimeException("Unexpected status code ${response.statusLine.statusCode} when fetcing $description")
            }

            objectMapper.readValue<List<KoodistoPalveluKoodi>>(response.entity.content.bufferedReader())
        }
    }

    override fun getKoodisto(koodisto: KoodistoName): List<KoodistoPalveluKoodi> =
        getKoodiListFromKoodistoPalvelu("/${koodisto.koodistoUri}/koodi?onlyValidKoodis=true", "koodisto ${koodisto}")

    override fun getAlakoodit(koodistoPalveluKoodi: KoodistoPalveluKoodi): List<KoodistoPalveluKoodi> =
        getKoodiListFromKoodistoPalvelu("/relaatio/sisaltyy-alakoodit/${koodistoPalveluKoodi.koodiUri}", "alakoodit for ${koodistoPalveluKoodi.koodiUri}")
}

@Repository
class ResourceKoodistoRepository(
    private val objectMapper: ObjectMapper
) : KoodistoRepository {
    fun koodiListFromResourceFile(resourceFileName: String): List<KoodistoPalveluKoodi> {
        val resourceFilePath = Paths.get("backup_data", resourceFileName)
        val resourceStream: InputStream = Thread.currentThread().contextClassLoader.getResourceAsStream(resourceFilePath.toString())
            ?: throw RuntimeException("Could not read $resourceFilePath")
        return objectMapper.readValue<List<KoodistoPalveluKoodi>>(resourceStream)
    }

    override fun getKoodisto(koodisto: KoodistoName): List<KoodistoPalveluKoodi> =
        koodiListFromResourceFile("koodisto_${koodisto.koodistoUri}.json")

    override fun getAlakoodit(koodistoPalveluKoodi: KoodistoPalveluKoodi): List<KoodistoPalveluKoodi> =
        koodiListFromResourceFile("koodisto_alakoodit_${koodistoPalveluKoodi.koodiUri}.json")
}
