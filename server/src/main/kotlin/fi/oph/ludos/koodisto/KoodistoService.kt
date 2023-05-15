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
        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCache() }, 10, 10, TimeUnit.MINUTES)

        try {
            updateCache()
        } catch (e: Exception) {
            logger.error("Failed to update koodisto cache", e)
        }
    }

    fun getKoodistos(): Map<KoodistoName, List<KoodiDtoOut>> {
        val cachedKoodistosAny =
            cacheManager.getCache(CacheName.KOODISTO.key)?.get("all")?.get()

        if (cachedKoodistosAny != null) {
            if (cachedKoodistosAny is Map<*, *>) {
                return cachedKoodistosAny as Map<KoodistoName, List<KoodiDtoOut>>
            } else {
                throw Exception("Cached koodistos is not a map")
            }
        }
        throw Exception("Koodistos not found in cache")
    }
    fun getKoodistos(language: Language): Map<KoodistoName, List<KoodiDtoOut>> = filterKooditByLanguage(getKoodistos(), language)

    fun getKoodisto(koodistoName: KoodistoName) : List<KoodiDtoOut> {
        return getKoodistos()[koodistoName] ?: throw Exception("Koodisto ${koodistoName.koodistoUri} not found in cache")
    }

    fun isKoodiArvoInKoodisto(koodistoName: KoodistoName, koodiArvo: String) : Boolean {
        return getKoodisto(koodistoName).any { it.koodiArvo == koodiArvo }
    }

    fun filterKooditByLanguage(
        koodistos: Map<KoodistoName, List<KoodiDtoOut>>, language: Language
    ): Map<KoodistoName, List<KoodiDtoOut>> = koodistos.mapValues { (_, koodisto) ->
        koodisto.filter { it.kieli == language.name }
    }


    private fun updateCache(): Map<KoodistoName, List<KoodiDtoOut>> {
        val koodistoMap = KoodistoName.values().associateWith {
            koodistoName -> koodistoRepository.getKoodisto(koodistoName).flatMap {
                koodi -> koodi.metadata.map {
                    metadatum -> KoodiDtoOut(koodi.koodiArvo, metadatum.nimi, metadatum.kieli)
                }
            }
        }
        cacheManager.getCache(CacheName.KOODISTO.key)?.put("all", koodistoMap)

        val koodistoStats = koodistoMap.keys.toList().sorted().map { koodistoName -> "$koodistoName: ${koodistoMap[koodistoName]?.count()}" }
        logger.info("Updated koodisto cache: $koodistoStats")

        return koodistoMap
    }
}