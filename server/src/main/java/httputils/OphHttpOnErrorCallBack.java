package httputils;

import java.util.Optional;
import java.util.function.Function;

/**
 * Binds status code(s) and callback function of OphHttpResponse.
 */
public interface OphHttpOnErrorCallBack<T> {
    /**
     * Bind callback method to provided status code.
     * @param callBack Function that gets server error message as argument and returns Optional that will be returned
     *                 by OphHttpResponse.expectedStatus() in case exception is handled by this callBack.
     * @return Response for continue this builder chain
     */
    OphHttpResponse<T> with(Function<String, Optional<T>> callBack);
}
