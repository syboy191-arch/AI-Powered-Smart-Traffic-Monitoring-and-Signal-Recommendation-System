package backend.service;

import backend.RecommendationService;
import backend.model.JobError;
import backend.model.JobStatus;
import backend.model.TrafficJob;
import backend.runner.DetectorException;
import backend.runner.DetectorRunner;
import backend.validation.ValidationException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class JobService {

    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    private final DetectorRunner detectorRunner;
    private final RecommendationService recommendationService;
    private final ObjectMapper mapper = new ObjectMapper();

    private final ConcurrentHashMap<String, TrafficJob> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Value("${traffic.storage-dir:${java.io.tmpdir}/traffic-monitor}")
    private String storageDirProperty;

    @Value("${traffic.max-pending-jobs:3}")
    private int maxPendingJobs;

    @Value("${traffic.job-ttl-seconds:3600}")
    private long jobTtlSeconds;

    public JobService(DetectorRunner detectorRunner, RecommendationService recommendationService) {
        this.detectorRunner = detectorRunner;
        this.recommendationService = recommendationService;
    }

    public TrafficJob submitJob(MultipartFile file) throws IOException {
        long queuedCount = jobs.values().stream()
            .filter(j -> j.getStatus() == JobStatus.QUEUED)
            .count();

        if (queuedCount >= maxPendingJobs) {
            throw new ValidationException("QUEUE_FULL", "Job queue is full. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
        }

        String jobId = UUID.randomUUID().toString();
        Path storageBase = getStorageDir();
        Path jobDir = storageBase.resolve(jobId);
        Files.createDirectories(jobDir);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "upload.mp4";
        }
        String ext = "mp4";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            ext = originalFilename.substring(dot + 1).toLowerCase();
        }

        Path inputVideoPath = jobDir.resolve("input." + ext);
        Path outputPath = jobDir.resolve("traffic_data.json");
        Path runDir = jobDir.resolve("runs");

        file.transferTo(inputVideoPath.toFile());

        TrafficJob job = new TrafficJob(jobId, originalFilename, jobDir, inputVideoPath, outputPath, runDir);
        jobs.put(jobId, job);

        executor.submit(() -> executeJob(job));

        return job;
    }

    public TrafficJob getJob(String jobId) {
        return jobs.get(jobId);
    }

    public Path getAnnotatedVideoPath(String jobId) {
        if (jobId == null || !jobId.matches("^[a-zA-Z0-9_-]+$")) {
            return null;
        }

        Path storageBase = getStorageDir();
        Path jobDir = storageBase.resolve(jobId).normalize();
        if (!jobDir.startsWith(storageBase)) {
            return null;
        }

        Path inRuns = jobDir.resolve("runs").resolve("annotated.mp4").normalize();
        if (inRuns.startsWith(jobDir) && Files.exists(inRuns) && Files.isRegularFile(inRuns)) {
            return inRuns;
        }

        Path inJob = jobDir.resolve("annotated.mp4").normalize();
        if (inJob.startsWith(jobDir) && Files.exists(inJob) && Files.isRegularFile(inJob)) {
            return inJob;
        }

        return null;
    }

    private void executeJob(TrafficJob job) {
        log.info("Executing job {}", job.getJobId());
        job.setStatus(JobStatus.PROCESSING);
        job.setProgress(0);

        try {
            detectorRunner.runDetection(
                job.getInputVideoPath(),
                job.getOutputPath(),
                job.getRunDir(),
                progress -> job.setProgress(progress)
            );

            // Read output JSON
            String json = Files.readString(job.getOutputPath());
            Map<String, Object> result = mapper.readValue(json, new TypeReference<Map<String, Object>>() {});

            String density = (String) result.get("density");
            String recommendation = recommendationService.computeRecommendation(density);
            result.put("recommendation", recommendation);

            job.setResult(result);
            job.setProgress(100);
            job.setStatus(JobStatus.COMPLETED);
            log.info("Job {} completed successfully", job.getJobId());

        } catch (DetectorException e) {
            log.warn("Job {} failed with {}: {}", job.getJobId(), e.getErrorCode(), e.getMessage());
            job.setStatus(JobStatus.FAILED);
            job.setError(new JobError(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error executing job {}", job.getJobId(), e);
            job.setStatus(JobStatus.FAILED);
            job.setError(new JobError("PROCESSING_FAILED", "Failed to process traffic video"));
        } finally {
            // Delete input video on success or failure
            try {
                Files.deleteIfExists(job.getInputVideoPath());
            } catch (Exception e) {
                log.warn("Failed to delete input video for job {}: {}", job.getJobId(), e.getMessage());
            }
        }
    }

    @Scheduled(fixedDelayString = "${traffic.cleanup-interval-ms:60000}")
    public void cleanupOldJobs() {
        Instant cutoff = Instant.now().minus(Duration.ofSeconds(jobTtlSeconds));

        // Cleanup in-memory entries and corresponding files
        jobs.entrySet().removeIf(entry -> {
            TrafficJob job = entry.getValue();
            if (job.getCreatedAt().isBefore(cutoff) && job.getStatus() != JobStatus.PROCESSING) {
                deleteDirectoryRecursively(job.getJobDir());
                return true;
            }
            return false;
        });

        // Sweep storage directory for expired folders
        try {
            Path storageBase = getStorageDir();
            if (Files.exists(storageBase)) {
                try (var stream = Files.list(storageBase)) {
                    stream.filter(Files::isDirectory).forEach(dir -> {
                        try {
                            var lastModified = Files.getLastModifiedTime(dir).toInstant();
                            if (lastModified.isBefore(cutoff)) {
                                deleteDirectoryRecursively(dir);
                            }
                        } catch (Exception ignored) {
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.debug("Error during storage directory sweep: {}", e.getMessage());
        }
    }

    private void deleteDirectoryRecursively(Path path) {
        if (path == null || !Files.exists(path)) return;
        try (var stream = Files.walk(path)) {
            stream.sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        } catch (Exception e) {
            log.debug("Error deleting directory {}: {}", path, e.getMessage());
        }
    }

    private Path getStorageDir() {
        return Paths.get(storageDirProperty).toAbsolutePath().normalize();
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }
}
