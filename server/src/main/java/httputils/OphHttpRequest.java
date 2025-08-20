package httputils;

import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.methods.RequestBuilder;

/**
 * Wrapper for Apache HttpRequest.
 */
public class OphHttpRequest {

    private HttpUriRequest httpUriRequest;

    private OphHttpRequest(Builder builder) {
        httpUriRequest = builder.requestBuilder.build();
    }

    HttpUriRequest getHttpUriRequest() {
        return httpUriRequest;
    }

    public static final class Builder {

        private RequestBuilder requestBuilder;

        public Builder(String method, String url) {
            requestBuilder = RequestBuilder.create(method).setUri(url);
        }

        public static Builder get(String url) {
            return new Builder(HttpGet.METHOD_NAME, url);
        }

        public static Builder delete(String url) {
            return new Builder(HttpDelete.METHOD_NAME, url);
        }

        public OphHttpRequest build() {
            return new OphHttpRequest(this);
        }

    }

}
