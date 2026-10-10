package backend.runner;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ProcessDetectorRunner implements DetectorRunner {

    private static final Logger log = LoggerFactory.getLogger(ProcessDetectorRunner.class);
    private static final Pattern PROGRESS_PATTERN = Pattern.compile("^PROGRESS\\s+(\\d+)$");

    @Value("${traffic.python-command:python}")
    private String pythonCommand;

    @Value("${traffic.detector-script:ai-service/detector.py}")
    private String detectorScript;

    @Value("${traffic.timeout-seconds:600}")
    private long timeoutSeconds;

    @Override
    public void runDetection(Path videoPath, Path outputPath, Path runDir, Consumer<Integer> progressConsumer) throws DetectorException {
        Path repoRoot = resolveRepoRoot();
        Path scriptPath = repoRoot.resolve(detectorScript).normalize();

        if (!Files.exists(scriptPath)) {
            log.error("Detector script not found at {}", scriptPath);
            throw new DetectorException("PROCESSING_FAILED", "Detector script not found");
        }

        List<String> command = new ArrayList<>();
        command.add(pythonCommand);
        command.add(scriptPath.toString());
        command.add("--video");
        command.add(videoPath.toAbsolutePath().toString());
        command.add("--output");
        command.add(outputPath.toAbsolutePath().toString());
        command.add("--run-dir");
        command.add(runDir.toAbsolutePath().toString());

        log.info("Starting detection subprocess: {}", command);

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(repoRoot.toFile());

        Process process;
        try {
            process = pb.start();
        } catch (Exception e) {
            log.error("Failed to start detector process", e);
            throw new DetectorException("PROCESSING_FAILED", "Failed to launch detector process", e);
        }

        // Capture stderr server-side only in a daemon thread
        Thread stderrThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[detector-stderr] {}", line);
                }
            } catch (Exception e) {
                log.debug("Error reading detector stderr: {}", e.getMessage());
            }
        });
        stderrThread.setDaemon(true);
        stderrThread.start();

        // Parse PROGRESS lines from stdout
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                Matcher matcher = PROGRESS_PATTERN.matcher(line.trim());
                if (matcher.matches()) {
                    try {
                        int progress = Integer.parseInt(matcher.group(1));
                        if (progressConsumer != null) {
                            progressConsumer.accept(progress);
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error reading detector stdout", e);
        }

        boolean completed;
        try {
            completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            destroyProcessTree(process);
            throw new DetectorException("PROCESSING_FAILED", "Detection process interrupted");
        }

        if (!completed) {
            log.error("Detector process timed out after {} seconds", timeoutSeconds);
            destroyProcessTree(process);
            throw new DetectorException("PROCESSING_FAILED", "Detection process timed out after " + timeoutSeconds + " seconds");
        }

        int exitCode = process.exitValue();
        log.info("Detector process finished with exit code {}", exitCode);

        if (exitCode == 0) {
            if (!Files.exists(outputPath)) {
                throw new DetectorException("PROCESSING_FAILED", "Detector did not produce output file");
            }
            return;
        }

        if (exitCode == 2) {
            throw new DetectorException("INVALID_VIDEO", "Video file is invalid or cannot be decoded");
        }

        throw new DetectorException("PROCESSING_FAILED", "Detection processing failed with exit code " + exitCode);
    }

    private void destroyProcessTree(Process process) {
        try {
            process.toHandle().descendants().forEach(ProcessHandle::destroyForcibly);
        } catch (Exception ignored) {
        }
        try {
            process.destroyForcibly();
        } catch (Exception ignored) {
        }
    }

    private Path resolveRepoRoot() {
        Path cwd = Paths.get("").toAbsolutePath();
        if (Files.exists(cwd.resolve(detectorScript))) {
            return cwd;
        }
        if (Files.exists(cwd.resolve("..").resolve(detectorScript).normalize())) {
            return cwd.resolve("..").normalize().toAbsolutePath();
        }
        return cwd;
    }
}
