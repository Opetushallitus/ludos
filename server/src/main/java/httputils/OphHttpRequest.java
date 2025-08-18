package httputils;

import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.methods.RequestBuilder;
import org.apache.http.entity.StringEntity;

/**
 * Wrapper for Apache HttpRequest.
 */
public class OphHttpRequest {

    private HttpUriRequest httpUriRequest;

    private OphHttpRequest(Builder builder) {
        httpUriRequest = builder.requestBuilder.build();
    }

    void addHeader(String name, String value) {
        httpUriRequest.addHeader(name, value);
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

        public static Builder post(String url) {
            return new Builder(HttpPost.METHOD_NAME, url);
        }

        public static Builder put(String url) {
            return new Builder(HttpPut.METHOD_NAME, url);
        }

        public static Builder delete(String url) {
            return new Builder(HttpDelete.METHOD_NAME, url);
        }

        public Builder addHeader(String name, String value) {
            requestBuilder.addHeader(name, value);
            return this;
        }

        public Builder setEntity(OphHttpEntity entity) {
            requestBuilder.setEntity(new StringEntity(entity.getContent(), entity.getContentType()));
            return this;
        }

        public OphHttpRequest build() {
            return new OphHttpRequest(this);
        }

    }

}
