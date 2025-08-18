package httputils;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.protocol.HttpContext;

class CasUtil {

    private static final String WAS_REDIRECTED_TO_CAS = "redirected_to_cas";

    static boolean isRedirectToCas(HttpResponse response) {
        Header location = response.getFirstHeader("Location");
        return location != null && isCasUrl(location.getValue());
    }

    static boolean isCasUrl(String uri) {
        return uri != null && (uri.endsWith("/cas") || uri.contains("/cas/") || uri.contains("/cas?"));
    }

    static boolean wasRedirectedToCas(HttpContext context) {
        return "true".equals(context.getAttribute(WAS_REDIRECTED_TO_CAS));
    }

    static String getCasAttributeName() {
        return WAS_REDIRECTED_TO_CAS;
    }

}