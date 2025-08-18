package httputils;

import httputils.exceptions.UnhandledHttpStatusCodeException;

import java.io.InputStream;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Terminates the response chain. Allows user to map and ignore response as whole. Allows also consuming the response
 * stream by user.
 * @param <T> Type of the expected return object.
 */
public interface OphHttpResponseHandler<T> {
    /**
     * Expects user to map the response text to object of type T.
     * @param handler Function that receives response content as string and is expected to map this into object of type T
     * @return Optional object of type T. In case response status is 204 or 404 Optional.empty is returned.
     * @throws UnhandledHttpStatusCodeException in case not expected status is received and no handler for this status
     * code is set
     */
    Optional<T> mapWith(Function<String, T> handler);

    /**
     * Convenience method for no input expected.
     */
    void ignoreResponse();

    /**
     * Allow user to handle response stream. In case unexpected status code is received provided error handlers for that
     * status code are executed.
     * @param handler Consumer for user to handle server response as InputStream. Stream is closed automatically.
     * @throws UnhandledHttpStatusCodeException in case not expected status is received and no handler for this status
     */
    void consumeStreamWith(Consumer<InputStream> handler);
}
