package backend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecommendationServiceTest {

    private final RecommendationService service = new RecommendationService();

    @Test
    void testRecommendations() {
        assertEquals("Increase signal duration", service.computeRecommendation("HIGH"));
        assertEquals("Normal traffic flow", service.computeRecommendation("MEDIUM"));
        assertEquals("Reduce signal waiting time", service.computeRecommendation("LOW"));
        assertEquals("Reduce signal waiting time", service.computeRecommendation(null));
        assertEquals("Reduce signal waiting time", service.computeRecommendation("UNKNOWN"));
    }
}
