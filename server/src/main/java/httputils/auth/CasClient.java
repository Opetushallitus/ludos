package httputils.auth;


import org.apache.commons.lang3.StringUtils;
import org.apache.http.Header;
import org.apache.http.NameValuePair;
import org.apache.http.client.CookieStore;
import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.cookie.Cookie;
import org.apache.http.impl.client.BasicCookieStore;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public final class CasClient {
  public static final String CAS_URL_SUFFIX = "/v1/tickets";
  public static final String SERVICE_URL_SUFFIX = "/j_spring_cas_security_check";
  private static final Logger logger = LoggerFactory.getLogger(CasClient.class);

  private static RequestConfig config = RequestConfig.custom()
      .setConnectTimeout(10 * 1000)
      .setConnectionRequestTimeout(10 * 1000)
      .setSocketTimeout(10 * 1000)
      .build();

  private CasClient() {
    // static-only access
  }

  /**
   * get cas service ticket, throws runtime exception if fails
   */
  public static String getTicket(String server, final String username, final String password, String service, boolean addSuffix) {

    logger.debug("getTicket for server:{}, username:{}, service::{} ", server, username, service);

    notNull(server, "server must not be null");
    notNull(username, "username must not be null");
    notNull(password, "password must not be null");
    notNull(service, "service must not be null");

    server = checkUrl(server, CAS_URL_SUFFIX);
    if (addSuffix) {
      service = checkUrl(service, SERVICE_URL_SUFFIX);
    }

    try (CloseableHttpClient client = HttpClientBuilder.create()
        .setDefaultRequestConfig(config)
        .setConnectionTimeToLive(60, TimeUnit.SECONDS)
        .build()) {
      return getServiceTicket(server, username, password, service, client);
    } catch (final Exception e) {
      throw new RuntimeException("failed to get CAS service ticket, server: " + server + ", service: " + service + ", cause: " + e, e);
    }
  }

  public static Cookie initServiceSession(String casServiceSessionInitUrl, String serviceTicket, String cookieName) {
    CookieStore httpCookieStore = new BasicCookieStore();
    HttpGet httpGet = new HttpGet(casServiceSessionInitUrl + "?" + "ticket=" + serviceTicket);
    setRequiredHeaders(httpGet);
    try (CloseableHttpClient client = HttpClientBuilder.create()
                .setDefaultRequestConfig(config)
                .setConnectionTimeToLive(60, TimeUnit.SECONDS)
                .setDefaultCookieStore(httpCookieStore)
                .build();
         CloseableHttpResponse response = (CloseableHttpResponse) client.execute(httpGet)) {
      for (Cookie cookie : httpCookieStore.getCookies()) {
        if (cookieName.equals(cookie.getName())) {
          return cookie;
        }
      }
      throw new RuntimeException("failed to init session to target service, response code: " + response.getStatusLine().getStatusCode() + ", casServiceSessionInitUrl: " + casServiceSessionInitUrl + ", serviceTicket: " + serviceTicket);
    } catch (final Exception e) {
      throw new RuntimeException("failed to init session to target service, casServiceSessionInitUrl: " + casServiceSessionInitUrl + ", serviceTicket: " + serviceTicket, e);
    }
  }

  private static void setRequiredHeaders(HttpRequestBase request) {
    request.addHeader("Caller-Id", "CasClient");
    request.addHeader("CSRF", "CSRF");
    request.addHeader("Cookie", "CSRF=CSRF");
  }

  private static String getServiceTicket(final String server, String username, String password, final String service, HttpClient client) throws UnsupportedEncodingException {
    final String ticketGrantingTicket = getTicketGrantingTicket(server, username, password, client);

    logger.debug("getServiceTicket: server:'{}', ticketGrantingTicket:'{}', service:'{}'", server, ticketGrantingTicket, service);

    HttpPost httpPost = new HttpPost(server + "/" + ticketGrantingTicket);
    setRequiredHeaders(httpPost);
    final List<NameValuePair> params = new ArrayList<NameValuePair>();
    params.add(new BasicNameValuePair("service", service));
    httpPost.setEntity(new UrlEncodedFormEntity(params, "UTF-8"));

    try (CloseableHttpResponse response = (CloseableHttpResponse) client.execute(httpPost)) {
      switch (response.getStatusLine().getStatusCode()) {
        case 200:
          logger.debug("serviceTicket found: {}", response);
          return EntityUtils.toString(response.getEntity(), "UTF-8");
        default:
          logger.warn("Invalid response code ({}) from CAS server!", response.getStatusLine().getStatusCode());
          logger.debug("Response (1k): " + response.getEntity().getContent().toString());
          throw new RuntimeException("failed to get CAS service ticket, response code: " + response.getStatusLine().getStatusCode()+ ", server: " + server + ", tgt: " + ticketGrantingTicket + ", service: " + service);
      }
    } catch (final Exception e) {
      throw new RuntimeException("failed to get CAS service ticket, server: " + server + ", tgt: " + ticketGrantingTicket + ", service: " + service + ", cause: " + e, e);
    }
  }

  private static String getTicketGrantingTicket(final String server, final String username, final String password, HttpClient client) throws UnsupportedEncodingException {
    logger.debug("getTicketGrantingTicket: server:'{}', user:'{}'", new Object[]{server, username});

    HttpPost httpPost = new HttpPost(server);
    setRequiredHeaders(httpPost);
    final List<NameValuePair> params = new ArrayList<NameValuePair>();
    params.add(new BasicNameValuePair("username", username));
    params.add(new BasicNameValuePair("password", password));
    httpPost.setEntity(new UrlEncodedFormEntity(params, "UTF-8"));

    try (CloseableHttpResponse response = (CloseableHttpResponse) client.execute(httpPost)) {
      switch (response.getStatusLine().getStatusCode()) {
        case 201: {
          Header[] locationHeaders = response.getHeaders("Location");
          logger.debug("locationHeader: " + locationHeaders);
          if (locationHeaders != null && locationHeaders.length == 1) {
            Header responseLocation = locationHeaders[0];
            String ticket = StringUtils.substringAfterLast(responseLocation.getValue(), "/");
            logger.debug("-> ticket: " + ticket);
            return ticket;
          }
          throw new RuntimeException("Successful ticket granting request, but no ticket found! server: " + server + ", user: " + username);
        }
        default: {
          throw new RuntimeException("Invalid response code from CAS server: " + response.getStatusLine().getStatusCode() + ", server: " + server + ", user: " + username);
        }
      }
    } catch (final Exception e) {
      throw new RuntimeException("error getting TGT, server: " + server + ", user: " + username + ", exception: " + e, e);
    }
  }

  private static void notNull(final Object object, final String message) {
    if (object == null) {
      throw new IllegalArgumentException(message);
    }
  }

  private static String checkUrl(String url, final String suffix) {
    logger.debug("url: " + url);
    url = url.trim();
    url = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    if (!url.endsWith(suffix)) {
      url += suffix;
    }
    logger.debug("-> fixed url: " + url);
    return url;
  }
}
