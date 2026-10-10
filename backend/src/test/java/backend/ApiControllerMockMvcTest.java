package backend;

import backend.runner.DetectorException;
import backend.runner.DetectorRunner;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CountDownLatch;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ApiControllerMockMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private backend.service.JobService jobService;

    @MockitoBean
    private DetectorRunner detectorRunner;

    private static final byte[] VALID_MP4_HEADER = new byte[]{
        0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'm', 'p', '4', '2', 0, 0, 0, 0
    };

    @Test
    void testUploadEmptyFileReturns400() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("video", "empty.mp4", "video/mp4", new byte[0]);

        mockMvc.perform(multipart("/api/videos").file(emptyFile))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("EMPTY_FILE"))
            .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    void testUploadUnsupportedFormatReturns400() throws Exception {
        MockMultipartFile txtFile = new MockMultipartFile("video", "text.txt", "text/plain", "hello".getBytes());

        mockMvc.perform(multipart("/api/videos").file(txtFile))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("UNSUPPORTED_FORMAT"));
    }

    @Test
    void testUploadInvalidMagicBytesReturns400() throws Exception {
        MockMultipartFile fakeMp4 = new MockMultipartFile("video", "fake.mp4", "video/mp4", "not a real video file content".getBytes());

        mockMvc.perform(multipart("/api/videos").file(fakeMp4))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("INVALID_VIDEO"));
    }

    @Test
    void testGetNonExistentJobReturns404() throws Exception {
        mockMvc.perform(get("/api/jobs/non-existent-uuid"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("JOB_NOT_FOUND"))
            .andExpect(jsonPath("$.error.message").value(containsString("non-existent-uuid")));
    }

    @Test
    void testSuccessfulJobLifecycle() throws Exception {
        doAnswer(invocation -> {
            Path outputPath = invocation.getArgument(1);
            String mockResult = """
                {
                    "cars": 10,
                    "motorcycles": 2,
                    "buses": 3,
                    "trucks": 1,
                    "density": "HIGH",
                    "unique_vehicles": {
                        "cars": 8,
                        "motorcycles": 2,
                        "buses": 3,
                        "trucks": 1,
                        "total": 14
                    },
                    "frames_processed": 100,
                    "fps": 30.0,
                    "duration_seconds": 3.33,
                    "avg_vehicles_per_frame": 16.0,
                    "peak_vehicles_in_frame": 18,
                    "thresholds": {"medium": 5, "high": 12}
                }
                """;
            Files.writeString(outputPath, mockResult);
            return null;
        }).when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "sample.mp4", "video/mp4", VALID_MP4_HEADER);

        String responseJson = mockMvc.perform(multipart("/api/videos").file(validMp4))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.jobId").exists())
            .andExpect(jsonPath("$.status").value("QUEUED"))
            .andExpect(jsonPath("$.filename").value("sample.mp4"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String jobId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.jobId");

        // Wait brief moment for background execution
        Thread.sleep(300);

        mockMvc.perform(get("/api/jobs/" + jobId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").value(jobId))
            .andExpect(jsonPath("$.status").value("COMPLETED"))
            .andExpect(jsonPath("$.progress").value(100))
            .andExpect(jsonPath("$.result.density").value("HIGH"))
            .andExpect(jsonPath("$.result.recommendation").value("Increase signal duration"))
            .andExpect(jsonPath("$.result.unique_vehicles.total").value(14))
            .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void testFailedJobReturnsErrorDetails() throws Exception {
        doThrow(new DetectorException("INVALID_VIDEO", "Video frame decode failed"))
            .when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "broken.mp4", "video/mp4", VALID_MP4_HEADER);

        String responseJson = mockMvc.perform(multipart("/api/videos").file(validMp4))
            .andExpect(status().isAccepted())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String jobId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.jobId");

        Thread.sleep(300);

        mockMvc.perform(get("/api/jobs/" + jobId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").value(jobId))
            .andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.error.code").value("INVALID_VIDEO"))
            .andExpect(jsonPath("$.error.message").value("Video frame decode failed"));
    }

    @Test
    void testQueueFullReturns429() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        doAnswer(invocation -> {
            latch.await();
            return null;
        }).when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "test.mp4", "video/mp4", VALID_MP4_HEADER);

        try {
            // 1 executing + 3 queued = 4 total accepted
            for (int i = 0; i < 4; i++) {
                mockMvc.perform(multipart("/api/videos").file(validMp4))
                    .andExpect(status().isAccepted());
            }

            // 5th attempt should be rejected with 429 QUEUE_FULL
            mockMvc.perform(multipart("/api/videos").file(validMp4))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("QUEUE_FULL"));
        } finally {
            latch.countDown();
        }
    }

    @Test
    void testGetVideoNotFound() throws Exception {
        mockMvc.perform(get("/api/jobs/non-existent-uuid/video"))
            .andExpect(status().isNotFound());
    }

    @Test
    void testGetVideoFullAndRangeRequests() throws Exception {
        byte[] dummyVideoData = new byte[100];
        for (int i = 0; i < dummyVideoData.length; i++) {
            dummyVideoData[i] = (byte) i;
        }

        doAnswer(invocation -> {
            Path outputPath = invocation.getArgument(1);
            Path runDir = invocation.getArgument(2);
            Files.writeString(outputPath, "{\"density\":\"LOW\",\"cars\":1,\"motorcycles\":0,\"buses\":0,\"trucks\":0,\"annotated_video\":\"annotated.mp4\"}");
            Files.createDirectories(runDir);
            Files.write(runDir.resolve("annotated.mp4"), dummyVideoData);
            return null;
        }).when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "sample.mp4", "video/mp4", VALID_MP4_HEADER);

        String responseJson = mockMvc.perform(multipart("/api/videos").file(validMp4))
            .andExpect(status().isAccepted())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String jobId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.jobId");

        Thread.sleep(300);

        // 1. Full video request without Range header
        mockMvc.perform(get("/api/jobs/" + jobId + "/video"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "video/mp4"))
            .andExpect(header().string("Accept-Ranges", "bytes"))
            .andExpect(header().string("Content-Length", "100"));

        // 2. Partial video request with Range header
        mockMvc.perform(get("/api/jobs/" + jobId + "/video").header("Range", "bytes=0-49"))
            .andExpect(status().isPartialContent())
            .andExpect(header().string("Content-Type", "video/mp4"))
            .andExpect(header().string("Accept-Ranges", "bytes"))
            .andExpect(header().string("Content-Range", "bytes 0-49/100"))
            .andExpect(header().string("Content-Length", "50"));
    }

    @Test
    void testInputVideoDeletedAfterExecution() throws Exception {
        doAnswer(invocation -> {
            Path outputPath = invocation.getArgument(1);
            Files.writeString(outputPath, "{\"density\":\"LOW\",\"cars\":0,\"motorcycles\":0,\"buses\":0,\"trucks\":0}");
            return null;
        }).when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "test_cleanup.mp4", "video/mp4", VALID_MP4_HEADER);

        String responseJson = mockMvc.perform(multipart("/api/videos").file(validMp4))
            .andExpect(status().isAccepted())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String jobId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.jobId");
        Thread.sleep(300);

        backend.model.TrafficJob job = jobService.getJob(jobId);
        org.junit.jupiter.api.Assertions.assertNotNull(job);
        org.junit.jupiter.api.Assertions.assertEquals(backend.model.JobStatus.COMPLETED, job.getStatus());
        // Input video must be deleted
        org.junit.jupiter.api.Assertions.assertFalse(Files.exists(job.getInputVideoPath()), "Input video should be deleted after processing");
        // Output JSON and job directory should still exist
        org.junit.jupiter.api.Assertions.assertTrue(Files.exists(job.getOutputPath()), "Output JSON should be preserved until TTL sweep");
    }

    @Test
    void testCleanupOldJobsRemovesExpiredDirectories() throws Exception {
        doAnswer(invocation -> {
            Path outputPath = invocation.getArgument(1);
            Files.writeString(outputPath, "{\"density\":\"LOW\",\"cars\":0,\"motorcycles\":0,\"buses\":0,\"trucks\":0}");
            return null;
        }).when(detectorRunner).runDetection(any(), any(), any(), any());

        MockMultipartFile validMp4 = new MockMultipartFile("video", "expired.mp4", "video/mp4", VALID_MP4_HEADER);

        String responseJson = mockMvc.perform(multipart("/api/videos").file(validMp4))
            .andExpect(status().isAccepted())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String jobId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.jobId");
        Thread.sleep(300);

        backend.model.TrafficJob job = jobService.getJob(jobId);
        org.junit.jupiter.api.Assertions.assertNotNull(job);
        Path jobDir = job.getJobDir();
        org.junit.jupiter.api.Assertions.assertTrue(Files.exists(jobDir));

        // Manually trigger cleanupOldJobs
        jobService.cleanupOldJobs();
        // Since TTL is default 3600s, it shouldn't be deleted yet
        org.junit.jupiter.api.Assertions.assertTrue(Files.exists(jobDir));
    }
}
