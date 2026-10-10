package backend;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class TrafficController {

    private final RecommendationService recommendationService;
    private final ObjectMapper mapper = new ObjectMapper();

    public TrafficController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/traffic/status")
    public Map<String, Object> getTrafficStatus() {
        try {
            Path path = Paths.get("../traffic_data.json");
            if (!Files.exists(path)) {
                path = Paths.get("traffic_data.json");
            }

            String json = Files.readString(path);
            Map<String, Object> data = mapper.readValue(json, new TypeReference<Map<String, Object>>() {});

            String density = (String) data.get("density");
            data.put("recommendation", recommendationService.computeRecommendation(density));

            return data;
        } catch (Exception e) {
            return Map.of(
                "error", "Unable to read traffic data"
            );
        }
    }
}
