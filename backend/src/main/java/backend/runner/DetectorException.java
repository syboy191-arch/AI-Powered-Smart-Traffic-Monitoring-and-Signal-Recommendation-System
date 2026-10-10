package backend.runner;

public class DetectorException extends Exception {
    private final String errorCode;

    public DetectorException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public DetectorException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
