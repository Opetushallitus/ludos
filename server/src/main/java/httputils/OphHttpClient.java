package httputils;

import static org.apache.http.HttpStatus.SC_UNAUTHORIZED;

import httputils.auth.Authenticator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.ConnectionReuseStrategy;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.ProtocolException;
import org.apache.http.client.CookieStore;
import org.apache.http.client.RedirectStrategy;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.config.SocketConfig;
import org.apache.http.conn.ConnectionKeepAliveStrategy;
import org.apache.http.conn.HttpClientConnectionManager;
import org.apache.http.impl.DefaultConnectionReuseStrategy;
import org.apache.http.impl.client.BasicCookieStore;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultRedirectStrategy;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.RedirectLocations;
import org.apache.http.impl.client.cache.CacheConfig;
import org.apache.http.impl.client.cache.CachingHttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.impl.cookie.BasicClientCookie;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;

import java.io.IOException;
import java.net.URI;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

/**
 * CAS supporting REST client.
 * See OphHttpResponseImplTest for usage.
 */
@Slf4j
public class OphHttpClient {
    private static final String CSRF = "CachingRestClient";

    private static class Headers {
        private static final String CALLER_ID = "Caller-Id";
        private static final String CSRF = "CSRF";
    }

    private final LogUtil logUtil;
    private final CloseableHttpClient cachingClient;
    private final CookieStore cookieStore;
    private final Authenticator authenticator;
    private final String callerId;

    private final ThreadLocal<HttpContext> localContext = ThreadLocal.withInitial(BasicHttpContext::new);
    private HashMap<String, Boolean> csrfCookiesCreateForHost = new HashMap<>();

    private OphHttpClient(Builder builder) {
        logUtil = new LogUtil(builder.allowUrlLogging, builder.connectionTimeoutMs, builder.socketTimeoutMs);
        authenticator = builder.authenticator;
        cookieStore = builder.cookieStore;
        callerId = builder.callerId;
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(builder.connectionTimeoutMs)
                .build();
        SocketConfig socketConfig = SocketConfig.custom()
                .setSoTimeout(builder.socketTimeoutMs)
                .build();

        HttpClientBuilder clientBuilder = builder.cacheConfig == null
                ? HttpClientBuilder.create()
                : CachingHttpClientBuilder.create().setCacheConfig(builder.cacheConfig);

        clientBuilder
                .setDefaultRequestConfig(requestConfig)
                .setDefaultSocketConfig(socketConfig)
                .setConnectionManager(builder.connectionManager)
                .setKeepAliveStrategy(builder.keepAliveStrategy)
                .setDefaultCookieStore(cookieStore)
                .setRedirectStrategy(builder.redirectStrategy)
                .setConnectionReuseStrategy(builder.reuseStrategy)
                .setConnectionTimeToLive(builder.connectionTTLSec, TimeUnit.SECONDS);

        cachingClient = clientBuilder.build();
    }

    /**
     * Provides chain of configurable response handlers for user.
     * @param request User defined request send to server.
     * @param <T> Type of returned object.
     * @return Configuration chain.
     */
    public <T> OphHttpResponse<T> execute(OphHttpRequest request) {
        CloseableHttpResponse httpResponse = execute(request.getHttpUriRequest(), true);
        return new OphHttpResponseImpl<>(httpResponse);
    }

    private CloseableHttpResponse execute(HttpUriRequest request, boolean retry) {
        ensureCSRFCookie(request.getURI().getHost());
        request.addHeader(Headers.CSRF, CSRF);

        if (StringUtils.isNotEmpty(this.callerId)
                && request.getFirstHeader(Headers.CALLER_ID) == null) {
            request.addHeader(Headers.CALLER_ID, this.callerId);
        }

        boolean wasJustAuthenticated = authenticate(request, retry);

        CloseableHttpResponse response = performRequest(request);

        // logging
        boolean isRedirCas = CasUtil.isRedirectToCas(response); // this response is 302 with location header pointing to cas
        boolean wasRedirCas = CasUtil.wasRedirectedToCas(localContext.get()); // this response is from cas after 302 redirect
        if (log.isDebugEnabled()) {
            log.debug(logUtil.info(request, response, isRedirCas, wasRedirCas, retry));
        }

        // just got new valid ticket, but still got cas login page.. something wrong with the system, target service didn't process the request/ticket correctly?
        if (retry && wasJustAuthenticated && (isRedirCas || wasRedirCas)) {
            throw new RuntimeException("Just got new valid ticket, but still got cas login page.. something wrong with the system, target service didn't process the request/ticket correctly?\n"
                    + logUtil.info(request, response, isRedirCas, wasRedirCas, true));
        }

        // authentication: was redirected to cas OR http 401 -> get ticket and retry once (but do it only once, hence 'retry')
        boolean isHttp401 = response.getStatusLine().getStatusCode() == SC_UNAUTHORIZED;
        if (isRedirCas || wasRedirCas || isHttp401) {
            if (retry) {
                log.warn("Redirected to CAS or 401 unauthorized, retrieving ticket again and retrying request");
                log.debug("Set redirected_to_cas=false");
                localContext.get().removeAttribute(CasUtil.getCasAttributeName());
                this.authenticator.clearSession();
                cookieStore.clear();
                csrfCookiesCreateForHost = new HashMap<>();

                try { response.close(); } catch (IOException e) { throw new RuntimeException(e); }
                return execute(request, false);
            } else {
                logUtil.error(request, response, "Was redirected to CAS or received 401 unauthorized error.");
            }
        }

        logUtil.logResponse(request, response);

        return response;
    }

    private synchronized void ensureCSRFCookie(String host) {
        if (!csrfCookiesCreateForHost.containsKey(host)) {
            csrfCookiesCreateForHost.put(host, true);
            BasicClientCookie cookie = new BasicClientCookie("CSRF", CSRF);
            cookie.setDomain(host);
            cookie.setPath("/");
            cookieStore.addCookie(cookie);
        }
    }

    private boolean authenticate(HttpUriRequest request, boolean retry) {
        try {
            return authenticator.authenticate(request, this.cookieStore);
        } catch (Exception e) {
            if (retry) {
                log.warn("Failed to CAS authenticate. Renewing proxy ticket.");
                log.debug("Failed to CAS authenticate. Renewing proxy ticket.", e);
                return false;
            } else {
                log.warn("Failed second time to CAS authenticate");
                log.debug("Failed second time to CAS authenticate", e);
                throw new RuntimeException("Failed to authenticate a second time. CAS likely didn't recognise TGT!");
            }
        }
    }

    private CloseableHttpResponse performRequest(HttpUriRequest request) {
        try {
            return cachingClient.execute(request, localContext.get());
        } catch (IOException e) {
            log.error("Failed to execute request: {}", request, e);
            throw new RuntimeException("Internal error calling " + request.getMethod() + "/" + request.getURI() + " (check logs): " + e.getMessage());
        }
    }

    public static final class Builder {
        int connectionTimeoutMs;
        int socketTimeoutMs;
        long connectionTTLSec;
        boolean allowUrlLogging;
        String callerId;
        Authenticator authenticator;
        CacheConfig cacheConfig;
        RedirectStrategy redirectStrategy;
        ConnectionKeepAliveStrategy keepAliveStrategy;
        HttpClientConnectionManager connectionManager;
        ConnectionReuseStrategy reuseStrategy;
        CookieStore cookieStore;

        /**
         * OphHttpClient builder
         * @param callerId Identifier for calling service
         */
        public Builder(String callerId) {
            connectionTimeoutMs = 10000; // 10s
            socketTimeoutMs = 10000; // 10s
            connectionTTLSec = 60; // infran palomuuri katkoo monta minuuttia makaavat connectionit
            allowUrlLogging = true;
            this.callerId = callerId;
            authenticator = Authenticator.NONE;
            cookieStore = new BasicCookieStore();

            connectionManager = createConnectionManager();
            keepAliveStrategy = createKeepAliveStrategy();
            redirectStrategy = createRedirectStrategy();
            reuseStrategy = new DefaultConnectionReuseStrategy();
            cacheConfig = null;
        }


        public Builder authenticator(Authenticator authenticator) {
            if (authenticator == null) throw new NullPointerException("Authenticator == null");
            this.authenticator = authenticator;
            return this;
        }

        public OphHttpClient build() {
            return new OphHttpClient(this);
        }

        private static ConnectionKeepAliveStrategy createKeepAliveStrategy() {
            return (response, context) -> 60 * 1000L; // Connection Keep Alive duration in ms (all hosts)
        }

        private static RedirectStrategy createRedirectStrategy() {
            return new DefaultRedirectStrategy() {
                @Override
                public URI getLocationURI(HttpRequest request, HttpResponse response, HttpContext context) throws ProtocolException {
                    URI locationURI = super.getLocationURI(request, response, context);
                    String uri = locationURI.toString();
                    if (CasUtil.isCasUrl(uri)) {
                        log.debug("Set redirected_to_cas=true, url: {}", uri);
                        context.setAttribute(CasUtil.getCasAttributeName(), "true");
                        context.setAttribute(HttpClientContext.REDIRECT_LOCATIONS, new RedirectLocations());
                    } else { // when redirecting back to service _from_ cas
                        log.debug("Set redirected_to_cas=false, url: {}", uri);
                        context.removeAttribute(CasUtil.getCasAttributeName());
                    }
                    return locationURI;
                }
            };
        }

        private static HttpClientConnectionManager createConnectionManager() {
            PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
            connectionManager.setDefaultMaxPerRoute(100); // default 2
            connectionManager.setMaxTotal(1000); // default 20
            return connectionManager;
        }

    }

}
