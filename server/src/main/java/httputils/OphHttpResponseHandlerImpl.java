package httputils;

import httputils.exceptions.UnhandledHttpStatusCodeException;
import org.apache.http.client.methods.CloseableHttpResponse;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.apache.http.HttpStatus.SC_NOT_FOUND;
import static org.apache.http.HttpStatus.SC_NO_CONTENT;

public class OphHttpResponseHandlerImpl<T> implements OphHttpResponseHandler<T> {
    private CloseableHttpResponse response;
    private Set<Integer> allowedStatusCodes;
    private Set<OphHttpOnErrorCallBackImpl<T>> ophHttpCallBackSet;

    OphHttpResponseHandlerImpl(CloseableHttpResponse response, int[] allowedStatusCodes, Set<OphHttpOnErrorCallBackImpl<T>> ophHttpCallBackSet) {
        this.response = response;
        this.allowedStatusCodes = Arrays.stream(allowedStatusCodes).boxed().collect(Collectors.toSet());
        this.ophHttpCallBackSet = ophHttpCallBackSet;
    }

    @Override
    public Optional<T> mapWith(Function<String, T> handler) {
        // Expected status code received
        if (this.allowedStatusCodes.stream().anyMatch(status -> status == this.response.getStatusLine().getStatusCode()) ) {
            return Optional.ofNullable(handler.apply(this.asTextAndClose()));
        }
        return this.notExpectedStatusCodeHandling(true);
    }

    private Optional<T> notExpectedStatusCodeHandling(boolean acceptEmptyResponse) {
        try {
            // Handled error code received
            return this.ophHttpCallBackSet.stream()
                    .filter(ophHttpCallBack -> ophHttpCallBack.getStatusCode()
                            .contains(this.response.getStatusLine().getStatusCode()))
                    .map(OphHttpOnErrorCallBackImpl::getCallBack)
                    .map(callback -> callback.apply(this.asTextAndClose()))
                    .findFirst()
                    .orElseThrow(() -> new UnhandledHttpStatusCodeException(this.asTextAndClose(), this.response.getStatusLine().getStatusCode()));
        } catch (UnhandledHttpStatusCodeException e) {
            // If user has not handled 404 NOT_FOUND or 204 NO_CONTENT assume it means empty resource content.
            if (acceptEmptyResponse && (this.response.getStatusLine().getStatusCode() == SC_NOT_FOUND || this.response.getStatusLine().getStatusCode() == SC_NO_CONTENT)) {
                return Optional.empty();
            }
            throw e;
        }
    }

    private String asTextAndClose() {
        try (InputStream inputStream = this.response.getEntity().getContent()) {
            return OphHttpResponseImpl.toString(inputStream);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            this.close();
        }
    }

    private void close() {
        try {
            this.response.close();
        } catch (IOException ioe) {
            throw new RuntimeException(ioe);
        }
    }


}
