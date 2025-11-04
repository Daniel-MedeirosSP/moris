package my.assist.moris.app.controller;

import my.assist.moris.app.service.AgenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.Map;

@Controller
public class HelloController {

    @Autowired
    private AgenteService agenteService;

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("message", "Olá! Sou o Moris 🤖. Como posso te ajudar?");
        return "chat";
    }

    @PostMapping("/")
    public String resposta(@RequestParam String prompt, Model model) {

        model.addAttribute("message", "Você disse: " + prompt);
        return "chat";
    }

    @PostMapping("/chat")
    @ResponseBody
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String resposta = agenteService.perguntarAoAgente(message);
        return Map.of("text", resposta);
    }
}
