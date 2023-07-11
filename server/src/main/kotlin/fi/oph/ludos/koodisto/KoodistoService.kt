package fi.oph.ludos.koodisto

import fi.oph.ludos.cache.CacheName
import org.slf4j.LoggerFactory
import org.springframework.cache.CacheManager
import org.springframework.stereotype.Service
import java.lang.IllegalStateException
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@Service
class KoodistoService(val koodistoRepository: KoodistoRepository, val cacheManager: CacheManager) {
    private final val logger: org.slf4j.Logger = LoggerFactory.getLogger(javaClass)

    init {
        try {
            upateCacheFromResources()
        } catch (e: Exception) {
            logger.error("Failed to initialize koodisto cache", e)
            throw e
        }

        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateCacheFromKoodistopalvelu() }, 0, 600, TimeUnit.SECONDS)
    }

    fun getKoodistos(): Map<KoodistoName, List<KoodiDtoOut>> {
        val cachedKoodistosAny =
            cacheManager.getCache(CacheName.KOODISTO.key)?.get("all")?.get()

        if (cachedKoodistosAny != null) {
            if (cachedKoodistosAny is Map<*, *>) {
                return cachedKoodistosAny as Map<KoodistoName, List<KoodiDtoOut>>
            } else {
                throw IllegalStateException("Cached koodistos is not a map")
            }
        }
        throw IllegalStateException("Koodistos accessed before initialization")
    }
    fun getKoodistos(language: Language): Map<KoodistoName, List<KoodiDtoOut>> = filterKooditByLanguage(getKoodistos(), language)

    fun getKoodisto(koodistoName: KoodistoName) : List<KoodiDtoOut> {
        return getKoodistos()[koodistoName] ?: throw Exception("Koodisto ${koodistoName.koodistoUri} not found in cache")
    }

    fun isKoodiArvoInKoodisto(koodistoName: KoodistoName, koodiArvo: String) : Boolean {
        return getKoodisto(koodistoName).any { it.koodiArvo == koodiArvo }
    }

    fun isKoodiArvosInKoodisto(koodistoName: KoodistoName, koodiArvos: Array<String>) : Boolean {
        return koodiArvos.all { isKoodiArvoInKoodisto(koodistoName, it) }
    }

    fun filterKooditByLanguage(
        koodistos: Map<KoodistoName, List<KoodiDtoOut>>, language: Language
    ): Map<KoodistoName, List<KoodiDtoOut>> = koodistos.mapValues { (_, koodisto) ->
        koodisto.filter { it.kieli == language.code }
    }

    private fun readKoodistos(koodistoGetter: (KoodistoName) -> Array<Koodi>, sourceName: String) {
        val koodistoMap = KoodistoName.values().associateWith {
                koodistoName -> koodistoGetter(koodistoName).flatMap {
                koodi -> koodi.metadata.map {
                    metadatum -> KoodiDtoOut(koodi.koodiArvo, metadatum.nimi, metadatum.kieli)
                }
            }
        }
        cacheManager.getCache(CacheName.KOODISTO.key)?.put("all", koodistoMap)

        val koodistoStats = koodistoMap.keys.toList().sorted().map { koodistoName -> "$koodistoName: ${koodistoMap[koodistoName]?.count()}" }
        logger.info("Updated koodisto cache from $sourceName: $koodistoStats")
    }

    private fun upateCacheFromResources() {
        readKoodistos({ koodistoName -> koodistoRepository.getKoodistoFromResource(koodistoName) }, "resource files")
    }

    private fun updateCacheFromKoodistopalvelu() {
        readKoodistos({ koodistoName -> koodistoRepository.getKoodistoFromKoodistopalvelu(koodistoName) }, "koodistopalvelu")
    }
}