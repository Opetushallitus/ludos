package fi.oph.ludos

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.web.filter.ForwardedHeaderFilter
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver
import kotlin.system.exitProcess


@SpringBootApplication
class LudosApplication

fun main(args: Array<String>) {
    validateProfile()
    runApplication<LudosApplication>(*args)
}

fun validateProfile() {
    if (System.getProperty("ludos.profileValidated") == "true") {
        return
    }
    val logger = LoggerFactory.getLogger(LudosApplication::class.java)
    val supportedProfiles = PathMatchingResourcePatternResolver().getResources("classpath*:application-*.yml")
        .map { it.filename?.replace("application-", "")?.replace(".yml", "") }
        .sortedBy { it }
    val activeProfiles = System.getProperty("spring.profiles.active")
    logger.info("Supported profiles: $supportedProfiles")
    logger.info("spring.profiles.active: '$activeProfiles'")
    if (supportedProfiles.find { it == activeProfiles } == null) {
        logger.error("FATAL ERROR: Spring profile not set or is not supported")
        exitProcess(1)
    }
    System.setProperty("ludos.profileValidated", "true")
}

@Configuration
class Config : WebMvcConfigurer {

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/**").addResourceLocations("classpath:/static/**").resourceChain(true)
            // resolving ALL files. Meaning nothing gets resolves automatically by pointing out "static" above.
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource {
                    val requestedResource: Resource = location.createRelative(resourcePath)
                    return if (requestedResource.exists() && requestedResource.isReadable) {
                        requestedResource
                    } else {
                        ClassPathResource("/static/index.html")
                    }
                }
            })

    }

    @Bean
    fun forwardedHeaderFilter(): FilterRegistrationBean<ForwardedHeaderFilter> {
        val filterRegistrationBean = FilterRegistrationBean<ForwardedHeaderFilter>()
        filterRegistrationBean.setFilter(ForwardedHeaderFilter())
        filterRegistrationBean.setOrder(0)
        return filterRegistrationBean
    }
}
