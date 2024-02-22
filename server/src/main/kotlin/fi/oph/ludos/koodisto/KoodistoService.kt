package fi.oph.ludos.koodisto

import org.slf4j.LoggerFactory
import org.springframework.aop.framework.AopProxyUtils
import org.springframework.stereotype.Service
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@Service
class KoodistoService(
    httpKoodistoRepository: HttpKoodistoRepository,
    resourceKoodistoRepository: ResourceKoodistoRepository,
) {
    private final val logger: org.slf4j.Logger = LoggerFactory.getLogger(javaClass)
    private var koodistoCache: Map<KoodistoLanguage, Map<KoodistoName, Map<String, KoodiDtoOut>>> = emptyMap()

    init {
        try {
            updateKoodistoCache(resourceKoodistoRepository)
        } catch (e: Exception) {
            logger.error("Failed to initialize koodisto cache", e)
            throw e
        }

        val scheduler = Executors.newScheduledThreadPool(1)
        scheduler.scheduleAtFixedRate({ updateKoodistoCache(httpKoodistoRepository) }, 0, 600, TimeUnit.SECONDS)
    }

    fun getKoodistos(): Map<KoodistoLanguage, Map<KoodistoName, Map<String, KoodiDtoOut>>> {
        if (koodistoCache.isEmpty()) {
            throw IllegalStateException("Koodistos accessed before initialization")
        }

        return koodistoCache
    }

    fun getKoodistosForlanguage(koodistoLanguage: KoodistoLanguage): Map<KoodistoName, Map<String, KoodiDtoOut>> =
        getKoodistos()[koodistoLanguage]
            ?: throw IllegalStateException("Language $koodistoLanguage not found in koodistoCache")

    fun getKoodisto(koodistoName: KoodistoName, koodistoLanguage: KoodistoLanguage): Map<String, KoodiDtoOut> {
        return getKoodistosForlanguage(koodistoLanguage)[koodistoName]
            ?: throw Exception("Koodisto ${koodistoName.koodistoUri} not found in $koodistoLanguage cache")
    }

    fun getKoodi(koodistoName: KoodistoName, koodistoLanguage: KoodistoLanguage, koodiArvo: String): KoodiDtoOut? {
        return getKoodisto(koodistoName, koodistoLanguage)[koodiArvo]
    }

    fun isKoodiArvoInKoodisto(koodistoName: KoodistoName, koodiArvo: String): Boolean {
        return getKoodi(koodistoName, KoodistoLanguage.FI, koodiArvo) != null
    }

    fun isKoodiArvosInKoodisto(koodistoName: KoodistoName, koodiArvos: List<String>): Boolean {
        return koodiArvos.all { isKoodiArvoInKoodisto(koodistoName, it) }
    }

    private fun shouldGetTarkenteet(koodistoPalveluKoodi: KoodistoPalveluKoodi) =
        koodistoPalveluKoodi.koodiUri in listOf(
            "oppiaineetjaoppimaaratlops2021_vka1",
            "oppiaineetjaoppimaaratlops2021_vkb1"
        )

    private fun koodiToKoodiDtoOut(
        koodistoPalveluKoodi: KoodistoPalveluKoodi,
        language: KoodistoLanguage,
        koodistoRepository: KoodistoRepository
    ): KoodiDtoOut? =
        koodistoPalveluKoodi.metadata.find { it.kieli == language.toString() }?.let { metadatum ->
            KoodiDtoOut(
                koodistoPalveluKoodi.koodiArvo,
                metadatum.nimi,
                if (shouldGetTarkenteet(koodistoPalveluKoodi))
                    koodistoRepository.getAlakoodit(koodistoPalveluKoodi).map { it.koodiArvo }
                else
                    null
            )
        }

    private fun actualClassName(proxy: Any) = AopProxyUtils.ultimateTargetClass(proxy).simpleName

    private fun updateKoodistoCache(koodistoRepository: KoodistoRepository) {
        try {
            val koodistos = KoodistoName.entries.associateWith { koodistoRepository.getKoodisto(it) }
            koodistoCache = KoodistoLanguage.entries.associateWith { language ->
                KoodistoName.entries.associateWith { koodistoName ->
                    koodistos[koodistoName]!!.mapNotNull { koodi ->
                        koodiToKoodiDtoOut(koodi, language, koodistoRepository)
                    }.associateBy { koodiDtoOut -> koodiDtoOut.koodiArvo }
                }
            }

            val koodistoStats = KoodistoName.entries.associateWith { koodistoName ->
                KoodistoLanguage.entries.map { koodistoLanguage ->
                    val koodisto = getKoodisto(koodistoName, koodistoLanguage)
                    val koodiCount = koodisto.count()
                    val tarkenneCount = koodisto.values.sumOf { it.tarkenteet?.size ?: 0 }
                    val tarkenneString = if (tarkenneCount > 0) "($tarkenneCount tarkennetta)" else ""
                    "$koodistoLanguage:$koodiCount$tarkenneString"
                }
            }
            logger.info("Updated koodisto cache from ${actualClassName(koodistoRepository)}: $koodistoStats")
        } catch (e: Exception) {
            logger.error("Error updating koodisto cache from ${actualClassName(koodistoRepository)}", e)
        }
    }

}