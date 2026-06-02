package fi.oph.ludos

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.filter.ForwardedHeaderFilter
import org.springframework.web.filter.ShallowEtagHeaderFilter
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver
import java.time.Duration
import kotlin.system.exitProcess

@SpringBootApplication
class LudosApplication {
    companion object {
        fun activeProfiles(): List<String> {
            val activeProfilesString =
                System.getProperty("spring.profiles.active") ?: System.getenv("SPRING_PROFILES_ACTIVE")
            return activeProfilesString?.split(",") ?: emptyList()
        }
    }
}

fun main(args: Array<String>) {
    val logger: Logger = LoggerFactory.getLogger(LudosApplication::class.java)
    val activeProfiles = LudosApplication.activeProfiles()
    logger.info("Initializing LudosApplication with active profiles: '$activeProfiles'")
    if (activeProfiles.isEmpty()) {
        logger.error("No profiles set!")
        exitProcess(1)
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
    private final val logger: org.slf4j.Logger = LoggerFactory.getLogger(javaClass)

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry
            .addResourceHandler("/assets/**")
            .addResourceLocations("classpath:/static/")
            .setCacheControl(
                // Kaikki /assetit sisältävät hashin, joka hoitaa cache-bustauksen: voi siis kakuttaa loputtomiin
                CacheControl.maxAge(Duration.ofDays(365)).sMaxAge(Duration.ofDays(365)).cachePublic().immutable()
            )
            .resourceChain(true)
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource? {
                    val requestedResource: Resource = location.createRelative("assets/${resourcePath}")
                    return if (requestedResource.exists() && requestedResource.isReadable) {
                        requestedResource
                    } else {
                        null
                    }
                }
            })

        // Palauta index.html kaikista tuntemattomista poluista, frontin SPA-router näyttää oikean sivun tai 404
        registry
            .addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource) = indexHtml
            })

    }

    @Bean
    fun shallowEtagHeaderFilter(): ShallowEtagHeaderFilter {
        return ShallowEtagHeaderFilter()
    }

    @Bean
    fun forwardedHeaderFilter(): FilterRegistrationBean<ForwardedHeaderFilter> {
        val filterRegistrationBean = FilterRegistrationBean<ForwardedHeaderFilter>()
        filterRegistrationBean.setFilter(ForwardedHeaderFilter())
        filterRegistrationBean.order = 0
        return filterRegistrationBean
    }
}

@Controller
class SpaRootController {
    @GetMapping("/")
    @ResponseBody
    fun index(): ResponseEntity<Resource> =
        ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(Config.indexHtml)
}

