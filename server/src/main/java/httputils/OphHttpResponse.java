package httputils;

/**
 * Provides user interface to handle errorous status codes from server and expected status codes.
 * @param <T> Expected type of the object returned at the end of a succesful server request.
 */
public interface OphHttpResponse<T> {
    /**
     * Separate handlers for given error status codes.
     * @param status Any number of status codes
     * @return Error callback chain.
     */
    OphHttpOnErrorCallBack<T> handleErrorStatus(int... status);

    /**
     * Provides user chance to map for given status codes
     * @param status Any number of status codes
     * @return Result handling chain.
     */
    OphHttpResponseHandler<T> expectedStatus(int... status);

}
