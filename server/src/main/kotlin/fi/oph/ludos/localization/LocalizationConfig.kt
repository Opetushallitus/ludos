package fi.oph.ludos.localization

import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.concurrent.ConcurrentMapCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestTemplate

@Configuration
class LocalizationConfig {
    @Bean
    fun restTemplate(): RestTemplate = RestTemplate()
}

@Configuration
@EnableCaching
class CacheConfig {
    @Bean
    fun cacheManager(): CacheManager = ConcurrentMapCacheManager("localizedTexts")
}