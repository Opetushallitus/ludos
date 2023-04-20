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
    fun restTemplate(): RestTemplate {
        return RestTemplate()
    }
}

@Configuration
@EnableCaching
class CacheConfig {
    @Bean
    fun cacheManager(): CacheManager {
        //todo: define cache properties such as time-to-live or maximum cache size?
        // what if localization api is down? should we keep the cache for many hours,
        // is it forever by default? I do not want it to expire
        return ConcurrentMapCacheManager("localizedTexts")
    }
}