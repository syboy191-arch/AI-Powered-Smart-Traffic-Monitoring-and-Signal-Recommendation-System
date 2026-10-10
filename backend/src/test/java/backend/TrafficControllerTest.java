package backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TrafficControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetTrafficStatusReturnsValidResponse() throws Exception {
        mockMvc.perform(get("/traffic/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.recommendation", anyOf(
                is("Increase signal duration"),
                is("Normal traffic flow"),
                is("Reduce signal waiting time")
            )));
    }
}
