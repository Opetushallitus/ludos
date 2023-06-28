package fi.oph.ludos

import io.github.cdimascio.dotenv.Dotenv
import io.github.cdimascio.dotenv.DotenvException
import io.github.cdimascio.dotenv.dotenv
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.web.filter.ForwardedHeaderFilter
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver
import java.util.logging.Logger

@SpringBootApplication
class LudosApplication

fun main(args: Array<String>) {
    val logger: Logger = Logger.getLogger(LudosApplication::class.java.name)
    val profile = System.getProperty("spring.profiles.active") ?: System.getenv("SPRING_PROFILES_ACTIVE")

    if (profile == "local" || profile == "local-untuvacas") {
        try {
            val dotenv: Dotenv = dotenv {
                filename = ".env"
            }
            dotenv.entries(Dotenv.Filter.DECLARED_IN_ENV_FILE).forEach { System.setProperty(it.key, it.value) }
        } catch (e: DotenvException) {
            logger.info("Could not read .env file. This is ok for non local environments")
        }
    }

    runApplication<LudosApplication>(*args)
}

@Configuration
class Config : WebMvcConfigurer {
    companion object {
        val indexHtml = ClassPathResource("/static/index.html")
    }

    init {
        if (!indexHtml.exists()) {
            throw IllegalStateException("index.html not found")
        }
    }

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/**").addResourceLocations("classpath:/static/**").resourceChain(true)
            // resolving ALL files. Meaning nothing gets resolves automatically by pointing out "static" above.
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource {
                    val requestedResource: Resource = location.createRelative(resourcePath)
                    return if (requestedResource.exists() && requestedResource.isReadable) {
                        requestedResource
                    } else {
                        indexHtml
                    }
                }
            })

    }

    @Bean
    fun forwardedHeaderFilter(): FilterRegistrationBean<ForwardedHeaderFilter> {
        val filterRegistrationBean = FilterRegistrationBean<ForwardedHeaderFilter>()
        filterRegistrationBean.filter = ForwardedHeaderFilter()
        filterRegistrationBean.order = 0
        return filterRegistrationBean
    }
}