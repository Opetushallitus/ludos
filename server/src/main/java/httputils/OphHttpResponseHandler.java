package httputils;

import httputils.exceptions.UnhandledHttpStatusCodeException;

import java.util.Optional;
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
     * @return Optional object of type T. In case response status is 204 or 404 Optional. Empty is returned.
     * @throws UnhandledHttpStatusCodeException in case not expected status is received and no handler for this status
     * code is set
     */
    Optional<T> mapWith(Function<String, T> handler);

}
