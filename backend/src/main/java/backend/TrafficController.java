package backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.nio.file.Files;
import java.nio.file.Paths;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
public class TrafficController {

    @GetMapping("/traffic/status")
    public Map<String, Object> getTrafficStatus() {

        try {
            String json = Files.readString(
                Paths.get("../traffic_data.json")
            );

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> data = mapper.readValue(json, Map.class);

            // Add recommendation based on density
            String density = (String) data.get("density");
            String recommendation;
            if ("HIGH".equals(density)) {
                recommendation = "Increase signal duration";
            } else if ("MEDIUM".equals(density)) {
                recommendation = "Normal traffic flow";
            } else {
                recommendation = "Reduce signal waiting time";
            }
            data.put("recommendation", recommendation);

            return data;

        } catch (Exception e) {
            return Map.of(
                "error", "Unable to read traffic data"
            );
        }
    }
}