package backend.runner;

import java.nio.file.Path;
import java.util.function.Consumer;

public interface DetectorRunner {
    void runDetection(Path videoPath, Path outputPath, Path runDir, Consumer<Integer> progressConsumer) throws DetectorException;
}
