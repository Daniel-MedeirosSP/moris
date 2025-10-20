package my.assist.moris.app.controller;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/hello")
public class HelloController {

    @GetMapping("/")
    public String Home(Model model) {
        model.addAttribute("message", "Hello, World!");
        return "index";
    }
}
