package fi.oph.ludos

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.Resource
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
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry // Capture everything (REST controllers get priority over this, see above)
            .addResourceHandler("/**") // Add locations where files might be found
            .addResourceLocations("classpath:/static/**") // Needed to allow use of `addResolver` below
            .resourceChain(true) // This thing is what does all the resolving. This impl. is responsible for
            // resolving ALL files. Meaning nothing gets resolves automatically by pointing
            // out "static" above.
            .addResolver(object : PathResourceResolver() {
                override fun getResource(resourcePath: String, location: Resource): Resource? {
                    val requestedResource: Resource = location.createRelative(resourcePath)

                    // If we actually hit a file, serve that. This is stuff like .js and .css files.
                    return if (requestedResource.exists() && requestedResource.isReadable) {
                        requestedResource
                    } else ClassPathResource("/static/index.html")

                    // Anything else returns the index.
                }
            })

    }
}