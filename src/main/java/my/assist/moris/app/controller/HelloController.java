package my.assist.moris.app.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HelloController {

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
}
