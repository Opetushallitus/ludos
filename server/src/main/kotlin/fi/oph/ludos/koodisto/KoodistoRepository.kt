//package fi.oph.ludos.koodisto
//
//import com.fasterxml.jackson.databind.ObjectMapper
//import org.apache.http.client.HttpClient
//import org.apache.http.client.methods.HttpGet
//import org.apache.http.impl.client.HttpClientBuilder
//import org.apache.http.util.EntityUtils
//import org.springframework.stereotype.Repository
//
//@Repository
//class KoodistoRepository {
//    private val httpClient: HttpClient = HttpClientBuilder.create().build()
//    private val objectMapper = ObjectMapper()
//
//    private val baseUrl = "https://virkailija.untuvaopintopolku.fi/koodisto-service/rest/json"
//
//    fun getKoodit(koodisto: Koodisto): List<Koodi> {
//        val url = "$baseUrl/${koodisto.koodisto}/koodi?onlyValidKoodis=true"
//
//        val httpGet = HttpGet(url)
//        val response = httpClient.execute(httpGet)
//        val entity = response.entity
//
//        val koodit = if (entity != null) {
//            val content = EntityUtils.toString(entity)
//            objectMapper.readValue(content, Array<Koodi>::class.java).toList()
//        } else {
//            emptyList()
//        }
//
//        EntityUtils.consume(entity)
//
//        return koodit
//    }
//}
//
