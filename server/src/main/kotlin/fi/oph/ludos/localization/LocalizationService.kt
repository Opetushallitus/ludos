package fi.oph.ludos.localization

import org.springframework.cache.CacheManager
import org.springframework.stereotype.Service
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit


@Service
class LocalizationService(val localizationRepository: LocalizationRepository, val cacheManager: CacheManager) {
    init {
        // Schedule cache update every 2 minutes
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCache() }, 0, 2, TimeUnit.MINUTES)

        // Init cache
        updateCache()
    }

    fun getLocalizationTexts(): Map<String, Map<String, Any>> {
        val cachedValue = cacheManager.getCache("localizedTexts")?.get("all")?.get() as? Map<String, Map<String, Any>>

        if (cachedValue != null) {
            println("cachedValue: $cachedValue")
            return cachedValue
        }

        return updateCache()

    }

    private fun updateCache(): Map<String, Map<String, Any>> {
        val unparsedArr = localizationRepository.getLocalizationTexts()
        val localizedTexts = mutableMapOf<String, Map<String, Any>>()

        for (locale in setOf("fi", "sv")) {
            val localeTexts = unparsedArr.filter { it.locale == locale }
            localizedTexts[locale] = mapOf("translation" to parseLocalizationTexts(localeTexts))
        }

        cacheManager.getCache("localizedTexts")?.put("all", localizedTexts)

        return localizedTexts
    }

    private fun parseLocalizationTexts(texts: List<Localization>): Map<String, Any> {
        val result = mutableMapOf<String, Any>()

        texts.forEach { localizationText ->
            val parts = localizationText.key.split(".")
            var current = result

            for (i in parts.indices) {
                val part = parts[i]
                // If we are at the last part of the key, set the value to the localization text value
                if (i == parts.lastIndex) {
                    current[part] = localizationText.value
                } else {
                    // If we are not at the last part of the key, create a nested map if it does not already exist
                    current.putIfAbsent(part, mutableMapOf<String, Any>())
                    // Update the current variable to point to the newly created nested map
                    // Cast to mutable map, as we know the key must exist now
                    current = current[part] as MutableMap<String, Any>
                }
            }
        }

        return result
    }
}
