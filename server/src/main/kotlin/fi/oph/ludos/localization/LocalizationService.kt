package fi.oph.ludos.localization

import fi.oph.ludos.cache.CacheName
import fi.oph.ludos.exception.LocalizationException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

enum class Locale(val locale: String) {
    FI("fi"), SV("sv")
}

@Service
class LocalizationService(val localizationRepository: LocalizationRepository, val cacheManager: CacheManager) {
    private final val logger: Logger = LoggerFactory.getLogger(javaClass)

    init {
        // Schedule cache update every 2 minutes
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCache() }, 2, 2, TimeUnit.MINUTES)

        try {
            // Init cache
            updateCache()
        } catch (e: Exception) {
            logger.error("Failed to update localization cache", e)
        }
    }

    fun getLocalizationTexts(): ResponseEntity<out Map<out Any?, Any?>> {
        val cachedValue = cacheManager.getCache(CacheName.LOCALIZED_TEXT.key)?.get("all")?.get() as? Map<*, *>

        if (cachedValue != null) {
            return ResponseEntity.ok(cachedValue)
        }

        return try {
            val localizedTexts = updateCache()
            ResponseEntity.ok(localizedTexts)
        } catch (e: LocalizationException) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to e.message))
        }
    }


    private fun updateCache(): Map<String, Map<String, Any>> {
        try {
            val unparsedArr = localizationRepository.getLocalizationTexts()
            val localizedTexts = mutableMapOf<String, Map<String, Any>>()
            for (locale in Locale.values().map { it.locale }) {
                val localeTexts = unparsedArr.filter { it.locale == locale }
                localizedTexts[locale] = mapOf("translation" to parseLocalizationTexts(localeTexts))
            }

            cacheManager.getCache(CacheName.LOCALIZED_TEXT.key)?.put("all", localizedTexts)

            val localeStats = Locale.values().map { locale -> "${locale.locale}: ${unparsedArr.filter { it.locale == locale.locale }.count()}" }
            logger.info("Updated localization cache: $localeStats")

            return localizedTexts
        } catch (e: Exception) {
            throw LocalizationException("${e.message}", e)
        }

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
