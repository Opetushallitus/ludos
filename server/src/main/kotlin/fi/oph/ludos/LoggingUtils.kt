package fi.oph.ludos

import ch.qos.logback.access.spi.IAccessEvent
import com.fasterxml.jackson.core.JsonGenerator
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.UserInfoForLogging
import jakarta.servlet.ServletRequest
import net.logstash.logback.composite.AbstractFieldJsonProvider
import net.logstash.logback.composite.JsonWritingUtils
import org.slf4j.spi.LoggingEventBuilder

fun LoggingEventBuilder.addLudosUserInfo(): LoggingEventBuilder {
    addKeyValue("user", UserInfoForLogging(Kayttajatiedot.fromSecurityContext()))
    return this
}

fun LoggingEventBuilder.addUserIp(request: ServletRequest?): LoggingEventBuilder {
    addKeyValue("ip", request?.remoteAddr ?: "unknown")
    return this
}

class RealRemoteHostProvider() : AbstractFieldJsonProvider<IAccessEvent>() {
    init {
        fieldName = "real_remote_host"
    }

    override fun writeTo(generator: JsonGenerator?, event: IAccessEvent?) {
        val remoteHostFromXforwardedFor =
            event?.request?.getHeader("X-Forwarded-For")?.replace("\\s".toRegex(), "")?.split(",")?.firstOrNull()
        JsonWritingUtils.writeStringField(generator, fieldName, remoteHostFromXforwardedFor ?: event?.remoteHost)
    }
}