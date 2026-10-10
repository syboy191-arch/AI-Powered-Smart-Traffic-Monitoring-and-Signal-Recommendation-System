package backend.model;

public record ErrorResponse(JobError error) {
    public ErrorResponse(String code, String message) {
        this(new JobError(code, message));
    }
}
