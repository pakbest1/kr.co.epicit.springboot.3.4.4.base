package kr.co.epicit.app.bbs.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/bbs")
public class BbsController {
	
	@GetMapping("/list")
	public String listForm(Model model) {
		
		return "views/bbs/list";
	}
}
