package fi.oph.ludos.localization

import org.apache.http.HttpResponse
import org.apache.http.client.HttpClient
import org.apache.http.client.methods.HttpGet
import org.apache.http.impl.client.HttpClientBuilder
import org.json.JSONArray
import org.springframework.stereotype.Repository

@Repository
class LocalizationRepository {
    private val httpClient: HttpClient = HttpClientBuilder.create().build()
    private val url = "https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation?category=ludos"

    fun getLocalizationTexts(): Array<Localization> {
        val request = HttpGet(url)
        val response: HttpResponse = httpClient.execute(request)
        val json = response.entity.content.bufferedReader().use { it.readText() }
        val jsonArray = JSONArray(json)

        return Array(jsonArray.length()) { index ->
            val jsonObject = jsonArray.getJSONObject(index)
            Localization(
                key = jsonObject.getString("key"),
                value = jsonObject.getString("value"),
                locale = jsonObject.getString("locale"),
                category = jsonObject.getString("category"),
                id = jsonObject.getInt("id")
            )
        }
    }
}
