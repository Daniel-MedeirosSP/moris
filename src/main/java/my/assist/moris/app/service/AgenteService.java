package my.assist.moris.app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;
import jakarta.annotation.PostConstruct;

@Service
public class AgenteService {

    private final String OLLAMA_URL = "http://localhost:11434/api";
    private final String MODELO = "phi3";
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void verificarModelo() {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                OLLAMA_URL + "/tags", Map.class
            );
            
            List<Map<String, Object>> models = (List<Map<String, Object>>) response.get("models");
            boolean modeloExiste = models.stream()
                .anyMatch(model -> ((String) model.get("name")).startsWith(MODELO));
            
            if (!modeloExiste) {
                baixarModelo();
            }
        } catch (Exception e) {
            System.err.println("Erro ao verificar modelo: " + e.getMessage());
        }
    }

    private void baixarModelo() {
        try {
            System.out.println("Baixando modelo " + MODELO + "...");
            Map<String, String> request = Map.of("name", MODELO);
            restTemplate.postForObject(OLLAMA_URL + "/pull", request, String.class);
            System.out.println("Modelo " + MODELO + " baixado com sucesso!");
        } catch (Exception e) {
            System.err.println("Erro ao baixar modelo: " + e.getMessage());
        }
    }

    public String perguntarAoAgente(String pergunta) {
        try {
            Map<String, Object> request = Map.of(
                "model", MODELO,
                "prompt", pergunta,
                "stream", false
            );
            
            Map<String, Object> response = restTemplate.postForObject(
                OLLAMA_URL + "/generate", request, Map.class
            );
            
            return (String) response.get("response");
        } catch (Exception e) {
            return "Erro ao conectar com o agente: " + e.getMessage();
        }
    }
}
