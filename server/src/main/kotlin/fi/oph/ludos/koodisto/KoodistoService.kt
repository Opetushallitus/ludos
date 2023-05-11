package fi.oph.ludos.koodisto

import fi.oph.ludos.cache.CacheName
import fi.oph.ludos.exception.LocalizationException
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Service
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@Service
class KoodistoService(val koodistoRepository: KoodistoRepository, val cacheManager: CacheManager) {
    private final val logger: org.slf4j.Logger = LoggerFactory.getLogger(javaClass)

    init {
        // Schedule cache update every 2 minutes
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCache() }, 10, 10, TimeUnit.MINUTES)

        try {
            // Init cache
            updateCache()
        } catch (e: Exception) {
            logger.error("Failed to update koodisto cache", e)
        }
    }

    fun getKoodit(language: Language): Map<String, KoodistoWithKoodit> {
        val cachedKoodisto =
            cacheManager.getCache(CacheName.KOODISTO.key)?.get("all")?.get() as? Map<String, KoodistoWithKoodit>?

        if (cachedKoodisto != null) {
            // filter out koodit by language. Language can be either FI or SV
            return filterKooditByLanguage(cachedKoodisto, language)
        }

        return try {
            // filter out koodit by language. Language can be either FI or SV
            filterKooditByLanguage(updateCache(), language)
        } catch (e: Exception) {
            throw e
        }
    }

    fun filterKooditByLanguage(
        koodistos: Map<String, KoodistoWithKoodit>, language: Language
    ): Map<String, KoodistoWithKoodit> = koodistos.mapValues { (_, koodisto) ->
        koodisto.copy(koodit = koodisto.koodit.filter { it.kieli == language.name })
    }


    private fun updateCache(): Map<String, KoodistoWithKoodit> {
        try {
            val koodistoWithKooditMap = mutableMapOf<String, KoodistoWithKoodit>()

            for (koodisto in ludosKoodistos) {
                val koodistotIn = koodistoRepository.getKoodistot(koodisto)

                val kooditOut = mutableListOf<KoodiDtoOut>()

                koodistotIn.forEach { koodi ->
                    koodi.metadata.forEach { metadata ->
                        val koodiOut = KoodiDtoOut(koodi.koodiArvo, metadata.nimi, metadata.kieli)
                        kooditOut.add(koodiOut)
                    }
                }

                val koodistoWithKoodit = KoodistoWithKoodit(koodisto.koodisto, kooditOut)

                koodistoWithKooditMap[koodisto.koodisto] = koodistoWithKoodit
            }

            cacheManager.getCache(CacheName.KOODISTO.key)?.put("all", koodistoWithKooditMap)

            val koodistoStats = koodistoWithKooditMap.keys.toList().sorted().map { koodistoName -> "$koodistoName: ${koodistoWithKooditMap[koodistoName]?.koodit?.count()}" }
            logger.info("Updated koodisto cache: $koodistoStats")

            return koodistoWithKooditMap
        } catch (e: Exception) {
            throw LocalizationException("${e.message}", e)
        }
    }
}