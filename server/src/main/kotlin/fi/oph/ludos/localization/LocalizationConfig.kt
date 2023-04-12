package fi.oph.ludos.localization

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