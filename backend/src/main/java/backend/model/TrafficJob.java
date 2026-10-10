package backend.model;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;

public class TrafficJob {
    private final String jobId;
    private final String filename;
    private final Instant createdAt;
    private final Path jobDir;
    private final Path inputVideoPath;
    private final Path outputPath;
    private final Path runDir;

    private volatile JobStatus status;
    private volatile Integer progress;
    private volatile Map<String, Object> result;
    private volatile JobError error;

    public TrafficJob(String jobId, String filename, Path jobDir, Path inputVideoPath, Path outputPath, Path runDir) {
        this.jobId = jobId;
        this.filename = filename;
        this.createdAt = Instant.now();
        this.jobDir = jobDir;
        this.inputVideoPath = inputVideoPath;
        this.outputPath = outputPath;
        this.runDir = runDir;
        this.status = JobStatus.QUEUED;
        this.progress = null;
        this.result = null;
        this.error = null;
    }

    public String getJobId() {
        return jobId;
    }

    public String getFilename() {
        return filename;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Path getJobDir() {
        return jobDir;
    }

    public Path getInputVideoPath() {
        return inputVideoPath;
    }

    public Path getOutputPath() {
        return outputPath;
    }

    public Path getRunDir() {
        return runDir;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public Map<String, Object> getResult() {
        return result;
    }

    public void setResult(Map<String, Object> result) {
        this.result = result;
    }

    public JobError getError() {
        return error;
    }

    public void setError(JobError error) {
        this.error = error;
    }

    public JobResponse toResponse() {
        return new JobResponse(jobId, status, progress, result, error);
    }
}
