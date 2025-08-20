package httputils;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpUriRequest;

import static org.apache.http.HttpStatus.*;

@Slf4j
class LogUtil {

    private static final String CAS_SECURITY_TICKET = "CasSecurityTicket";
    // PERA
    public static final String X_KUTSUKETJU_ALOITTAJA_KAYTTAJA_TUNNUS = "X-Kutsuketju.Aloittaja.KayttajaTunnus";
    public static final String X_PALVELUKUTSU_LAHETTAJA_KAYTTAJA_TUNNUS = "X-Palvelukutsu.Lahettaja.KayttajaTunnus";

    private boolean allowUrlLogging;
    private int connectionTimeoutMs;
    private int socketTimeoutMs;

    LogUtil(boolean allowUrlLogging, int connectionTimeoutMs, int socketTimeoutMs) {
        this.allowUrlLogging = allowUrlLogging;
        this.connectionTimeoutMs = connectionTimeoutMs;
        this.socketTimeoutMs = socketTimeoutMs;
    }

    void logResponse(HttpUriRequest req, HttpResponse response) {
        if(response.getStatusLine().getStatusCode() == SC_FORBIDDEN) {
            error(req, response, "Access denied error calling REST resource");
        }

        if(response.getStatusLine().getStatusCode() >= SC_INTERNAL_SERVER_ERROR) {
            error(req, response, "Internal error calling REST resource");
        }

        if(response.getStatusLine().getStatusCode() >= SC_NOT_FOUND) {
            error(req, response, "Not found error calling REST resource");
        }

        if(response.getStatusLine().getStatusCode() == SC_BAD_REQUEST) {
            error(req, response, "Bad request error calling REST resource");
        }
    }

    void error(HttpUriRequest req, HttpResponse response, final String msg) {
        String message = msg + ", " + info(req, response);
        log.error(message);
    }

    String info(HttpUriRequest req, HttpResponse response, boolean isRedirCas, boolean wasRedirCas, boolean retry) {
        return info(req, response)
                + ", isredircas: " + isRedirCas
                + ", wasredircas: " + wasRedirCas
                + ", retry: " + retry;
    }

    String info(HttpUriRequest req, HttpResponse response) {
        return "url: " + (allowUrlLogging ? req.getURI() : "hidden")
                + ", method: " + req.getMethod()
                + ", status: " + (response != null && response.getStatusLine() != null ? response.getStatusLine().getStatusCode() : "?")
                + ", userInfo: " + getUserInfo(req)
                + ", connectionTimeoutMs: " + connectionTimeoutMs
                + ", socketTimeoutMs: " + socketTimeoutMs
                ;
    }

    private String getUserInfo(HttpUriRequest req) {
        return header(req, "current", X_KUTSUKETJU_ALOITTAJA_KAYTTAJA_TUNNUS)
                + header(req, "caller", X_PALVELUKUTSU_LAHETTAJA_KAYTTAJA_TUNNUS)
                + header(req, "ticket", CAS_SECURITY_TICKET);
    }

    private String header(HttpUriRequest req, String info, String name) {
        Header[] headers = req.getHeaders(name);
        StringBuilder res = new StringBuilder();
        if (headers != null && headers.length > 0) {
            res.append("|").append(info).append(":");
            for (Header header : headers) {
                res.append(header.getValue());
            }
        }
        return res.toString();
    }


}
