package backend.model;

public record VideoUploadResponse(String jobId, JobStatus status, String filename) {
}
