package fi.oph.ludos

import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.UserInfoForLogging
import jakarta.servlet.ServletRequest
import org.slf4j.spi.LoggingEventBuilder

fun LoggingEventBuilder.addLudosUserInfo(): LoggingEventBuilder {
    addKeyValue("user", UserInfoForLogging(Kayttajatiedot.fromSecurityContext()))
    return this
}

fun LoggingEventBuilder.addUserIp(request: ServletRequest?): LoggingEventBuilder {
    addKeyValue("ip", request?.remoteAddr ?: "unknown")
    return this
}
