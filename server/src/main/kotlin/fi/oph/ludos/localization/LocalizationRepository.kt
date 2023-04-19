package fi.oph.ludos.localization

import fi.oph.ludos.exception.LocalizationException
import org.springframework.stereotype.Repository
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestTemplate

@Repository
class LocalizationRepository(private val restTemplate: RestTemplate) {
    fun getLocalizationTexts(): Array<Localization> {
        val url = "https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation?category=ludos"

        return try {
            restTemplate.getForObject(url, Array<Localization>::class.java) ?: emptyArray()
        } catch (e: RestClientException) {
            throw LocalizationException("Failed to get localization texts", e)
        }
    }
}

