package backend.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record JobResponse(
    String jobId,
    JobStatus status,
    Integer progress,
    Map<String, Object> result,
    JobError error
) {
}
