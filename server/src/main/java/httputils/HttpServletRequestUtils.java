package httputils;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Predicate;

public class HttpServletRequestUtils {
    private static final Logger LOGGER = LoggerFactory.getLogger(HttpServletRequestUtils.class);
    private static final Set<String> HARMLESS_URLS = parseHarmlessUrlsFromSystemProperty();
    private static final boolean SKIP_MISSING_HEADER_LOGGING = "true".equals(
        System.getProperty("fi.vm.sade.javautils.http.HttpServletRequestUtils.SKIP_MISSING_HEADER_LOGGING"));

    static {
        if (SKIP_MISSING_HEADER_LOGGING) {
            LOGGER.warn("Skipping missing real IPs logging. This should not be used in production.");
        }
    }

    private static Set<String> parseHarmlessUrlsFromSystemProperty() {
        String property = System.getProperty("fi.vm.sade.javautils.http.HttpServletRequestUtils.HARMLESS_URLS");
        if (StringUtils.isBlank(property)) {
            return Collections.emptySet();
        }
        return new HashSet<>(Arrays.asList(property.split(",")));
    }

    public static String getRemoteAddress(HttpServletRequest httpServletRequest) {
        return getRemoteAddress(httpServletRequest.getHeader("X-Real-IP"),
            httpServletRequest.getHeader("X-Forwarded-For"),
            httpServletRequest.getRemoteAddr(),
            httpServletRequest.getRequestURI());
    }

    public static String getRemoteAddress(String xRealIp, String xForwardedFor, String remoteAddr, String requestURI) {
        Predicate<String> isNotBlank = (String txt) -> txt != null && !txt.isEmpty();
        if (isNotBlank.test(xRealIp)) {
            return xRealIp;
        }
        if (isNotBlank.test(xForwardedFor)) {
            if (xForwardedFor.contains(",")) {
                LOGGER.error("Could not find X-Real-IP header, but X-Forwarded-For contains multiple values: {}, " +
                        "this can cause problems", xForwardedFor);
            }
            return xForwardedFor;
        }
        if (!SKIP_MISSING_HEADER_LOGGING && !HARMLESS_URLS.contains(requestURI)) {
            LOGGER.warn(String.format("X-Real-IP or X-Forwarded-For was not set. Are we not running behind a load balancer? Request URI is '%s'", requestURI));
        }
        return remoteAddr;
    }
}
