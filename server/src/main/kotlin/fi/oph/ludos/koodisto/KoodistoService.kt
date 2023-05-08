package fi.oph.ludos.koodisto

import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.http.client.HttpClient
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClientBuilder
import org.springframework.stereotype.Service

@Service
class KoodistoService(private val objectMapper: ObjectMapper) {
    private val httpClient: HttpClient = HttpClientBuilder.create().build()

    private val baseUrl = "https://virkailija.untuvaopintopolku.fi/koodisto-service/rest/json"
    fun getKoodit(): List<KoodistoDtoOut> {
        val koodit = mutableListOf<KoodistoDtoOut>()

        for (koodisto in koodistot) {
            val url = "$baseUrl/${koodisto.koodisto}/koodi?onlyValidKoodis=true"
            val httpGet = HttpGet(url)
            val response = httpClient.execute(httpGet)
            val entity = response.entity.content.bufferedReader().use { it.readText() }
            val koodiList = objectMapper.readValue(entity, Array<Koodi>::class.java)
            val kooditOut = mutableListOf<KoodiDtoOut>()

            koodiList.forEach { koodi ->
                koodi.metadata.forEach { metadata ->
                    if ((metadata.kieli == "FI" && koodisto.getFinnishName) ||
                        (metadata.kieli == "SV" && koodisto.getSwedishName)) {
                        val koodiOut = KoodiDtoOut(koodi.koodiUri, koodi.koodiArvo, metadata.nimi, metadata.kieli)
                        kooditOut.add(koodiOut)
                    }
                }
            }
            val koodistoOut = KoodistoDtoOut(koodisto.koodisto, kooditOut)
            koodit.add(koodistoOut)
        }

        return koodit
    }

}