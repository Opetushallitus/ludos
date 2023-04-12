package fi.oph.ludos.localization

import org.springframework.stereotype.Repository
import org.springframework.web.client.RestTemplate


@Repository
class LocalizationRepository(private val restTemplate: RestTemplate) {
    fun getLocalizationTexts(): Array<Localization> {
        val url =
            "https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation?category=ludos"

        return restTemplate.getForObject(url, Array<Localization>::class.java)
            ?: throw Exception("Localization texts not found")
    }
}

