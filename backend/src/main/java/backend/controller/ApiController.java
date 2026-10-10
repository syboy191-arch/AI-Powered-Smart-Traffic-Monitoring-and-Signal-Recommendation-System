package backend.controller;

import backend.model.ErrorResponse;
import backend.model.TrafficJob;
import backend.model.VideoUploadResponse;
import backend.service.JobService;
import backend.validation.VideoValidator;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ApiController {

    private final JobService jobService;
    private final VideoValidator videoValidator;

    public ApiController(JobService jobService, VideoValidator videoValidator) {
        this.jobService = jobService;
        this.videoValidator = videoValidator;
    }

    @PostMapping("/videos")
    public ResponseEntity<VideoUploadResponse> uploadVideo(@RequestParam("video") MultipartFile file) throws IOException {
        videoValidator.validate(file);
        TrafficJob job = jobService.submitJob(file);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
            .body(new VideoUploadResponse(job.getJobId(), job.getStatus(), job.getFilename()));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId) {
        TrafficJob job = jobService.getJob(jobId);
        if (job == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("JOB_NOT_FOUND", "Job not found: " + jobId));
        }
        return ResponseEntity.ok(job.toResponse());
    }

    @GetMapping("/jobs/{jobId}/video")
    public ResponseEntity<ResourceRegion> getJobVideo(
            @PathVariable String jobId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) throws IOException {

        Path videoPath = jobService.getAnnotatedVideoPath(jobId);
        if (videoPath == null || !Files.exists(videoPath) || !Files.isRegularFile(videoPath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(videoPath);
        long contentLength = resource.contentLength();

        if (rangeHeader != null && !rangeHeader.isBlank()) {
            List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
            if (!ranges.isEmpty()) {
                HttpRange range = ranges.get(0);
                long start = range.getRangeStart(contentLength);
                long end = range.getRangeEnd(contentLength);
                long rangeLength = end - start + 1;
                ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .contentType(MediaType.parseMediaType("video/mp4"))
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .body(region);
            }
        }

        ResourceRegion region = new ResourceRegion(resource, 0, contentLength);
        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.parseMediaType("video/mp4"))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(region);
    }
}
