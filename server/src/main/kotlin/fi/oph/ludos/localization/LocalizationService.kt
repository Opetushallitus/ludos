package fi.oph.ludos.localization

import fi.oph.ludos.cache.CacheName
import fi.oph.ludos.exception.LocalizationException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Service
import java.lang.IllegalStateException
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

enum class Locale(val locale: String) {
    FI("fi"), SV("sv")
}

@Service
class LocalizationService(val localizationRepository: LocalizationRepository, val cacheManager: CacheManager) {
    private final val logger: Logger = LoggerFactory.getLogger(javaClass)

    init {
        try {
            updateCacheFromResourceFile()
        } catch (e: Exception) {
            logger.error("Failed to initialize localization cache", e)
            throw e
        }

        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCacheFromLokalisointipalvelu() }, 0, 120, TimeUnit.SECONDS)
    }

    fun getLocalizationTexts(): Map<*, *> {
        val cachedValue = cacheManager.getCache(CacheName.LOCALIZED_TEXT.key)?.get("all")?.get() as? Map<*, *>

        return cachedValue ?: throw IllegalStateException("Reading localizations before cache initialized")
    }

    private fun updateCache(localizations: Array<Localization>, sourceName: String) {
        try {
            val localizedTexts = mutableMapOf<String, Map<String, Any>>()
            for (locale in Locale.values().map { it.locale }) {
                val localeTexts = localizations.filter { it.locale == locale }
                localizedTexts[locale] = mapOf("translation" to parseLocalizationTexts(localeTexts))
            }

            cacheManager.getCache(CacheName.LOCALIZED_TEXT.key)?.put("all", localizedTexts)

            val localeStats = Locale.values()
                .map { locale -> "${locale.locale}: ${localizations.filter { it.locale == locale.locale }.count()}" }
            logger.info("Updated localization cache from $sourceName: $localeStats")
        } catch (e: Exception) {
            throw LocalizationException("${e.message}", e)
        }
    }

    private fun updateCacheFromLokalisointipalvelu() {
        updateCache(localizationRepository.getLocalizationTextsFromLokalisointipalvelu(), "lokalisointipalvelu")
    }

    private fun updateCacheFromResourceFile() {
        updateCache(localizationRepository.getLocalizationTextsFromResourceFile(), "resource file")
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
