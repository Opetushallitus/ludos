package fi.oph.ludos

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


@SpringBootApplication
class LudosApplication

fun main(args: Array<String>) {
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
        filterRegistrationBean.setFilter(ForwardedHeaderFilter())
        filterRegistrationBean.setOrder(0)
        return filterRegistrationBean
    }
}
