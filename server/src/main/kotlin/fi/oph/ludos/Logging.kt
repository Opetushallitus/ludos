package fi.oph.ludos

import ch.qos.logback.access.spi.IAccessEvent
import ch.qos.logback.access.tomcat.LogbackValve
import com.fasterxml.jackson.core.JsonGenerator
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.UserInfoForLogging
import jakarta.servlet.Filter
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import jakarta.servlet.http.HttpServletRequest
import net.logstash.logback.composite.AbstractFieldJsonProvider
import net.logstash.logback.composite.JsonWritingUtils
import org.slf4j.MDC
import org.slf4j.spi.LoggingEventBuilder
import org.springframework.boot.web.embedded.tomcat.ConfigurableTomcatWebServerFactory
import org.springframework.boot.web.server.WebServerFactoryCustomizer
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


fun LoggingEventBuilder.addLudosUserInfo(): LoggingEventBuilder {
    addKeyValue("user", UserInfoForLogging(Kayttajatiedot.fromSecurityContext()))
    return this
}

fun LoggingEventBuilder.addUserIp(request: ServletRequest?): LoggingEventBuilder {
    addKeyValue("real_remote_host", request?.remoteAddr ?: "unknown")
    return this
}

class RealRemoteHostProvider : AbstractFieldJsonProvider<IAccessEvent>() {
    init {
        fieldName = "real_remote_host"
    }

    override fun writeTo(generator: JsonGenerator?, event: IAccessEvent?) {
        val remoteHostFromXforwardedFor =
            event?.request?.getHeader("X-Forwarded-For")?.replace("\\s".toRegex(), "")?.split(",")?.firstOrNull()
        JsonWritingUtils.writeStringField(generator, fieldName, remoteHostFromXforwardedFor ?: event?.remoteHost)
    }
}

@Configuration
class LogbackAccessConfiguration : WebServerFactoryCustomizer<ConfigurableTomcatWebServerFactory> {
    override fun customize(factory: ConfigurableTomcatWebServerFactory) {
        val logbackValve = LogbackValve()
        logbackValve.filename = "logback-access.xml"
        factory.addEngineValves(logbackValve)
    }
}

class CorrelationIdFilter : Filter {
    companion object {
        const val CORRELATION_ID_LOG_FIELD_NAME = "correlation_id"
        const val CORRELATION_ID_HEADER_NAME = "X-Amz-Cf-Id"
    }

    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        if (request is HttpServletRequest) {
            var correlationId = request.getHeader(CORRELATION_ID_HEADER_NAME)
            if (correlationId.isNullOrEmpty()) {
                correlationId = java.util.UUID.randomUUID().toString()
            }
            request.setAttribute(CORRELATION_ID_LOG_FIELD_NAME, correlationId)
            MDC.put(CORRELATION_ID_LOG_FIELD_NAME, correlationId)
            chain.doFilter(request, response)
            MDC.clear()
        } else {
            chain.doFilter(request, response)
        }
    }
}

@Configuration
class CorrelationIdFilterConfig {
    @Bean
    fun requestIdFilter(): FilterRegistrationBean<CorrelationIdFilter> {
        val registrationBean
                : FilterRegistrationBean<CorrelationIdFilter> = FilterRegistrationBean<CorrelationIdFilter>()
        registrationBean.filter = CorrelationIdFilter()
        registrationBean.addUrlPatterns("/*")
        return registrationBean
    }
}