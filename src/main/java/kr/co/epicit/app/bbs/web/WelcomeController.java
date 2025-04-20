package kr.co.epicit.app.bbs.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/welcome")
public class WelcomeController {
	
	@GetMapping(value={ "/", "/index" })
	public String index(Model model) {
		
		
		return "views/welcome";
	}
	
}
