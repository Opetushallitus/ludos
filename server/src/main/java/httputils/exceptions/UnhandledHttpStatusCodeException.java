package httputils.exceptions;

public class UnhandledHttpStatusCodeException extends RuntimeException {
    public UnhandledHttpStatusCodeException() {
        super();
    }

    public UnhandledHttpStatusCodeException(String message) {
        super(message);
    }

    public UnhandledHttpStatusCodeException(String message, int statusCode) {
        super(String.format("Invalid status code %d. %s", statusCode, message));
    }

    public UnhandledHttpStatusCodeException(Throwable cause) {
        super(cause);
    }

    public UnhandledHttpStatusCodeException(String message, Throwable cause) {
        super(message, cause);
    }
}
