package httputils.auth;

import org.apache.http.client.CookieStore;
import org.apache.http.client.methods.HttpUriRequest;

public interface Authenticator {

    Authenticator NONE = new Authenticator() {
        @Override
        public void clearSession() {
        }

        @Override
        public boolean authenticate(HttpUriRequest request, CookieStore cookieStore) {
            return false;
        }

        @Override
        public String getUrlPrefix() {
            return "";
        }


    };

    void clearSession();

    boolean authenticate(HttpUriRequest request, CookieStore cookieStore);

    String getUrlPrefix();

}
