package backend;

import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    public String computeRecommendation(String density) {
        if ("HIGH".equals(density)) {
            return "Increase signal duration";
        } else if ("MEDIUM".equals(density)) {
            return "Normal traffic flow";
        } else {
            return "Reduce signal waiting time";
        }
    }
}
