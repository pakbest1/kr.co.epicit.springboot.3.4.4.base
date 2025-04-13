package kr.co.epicit.app.bbs.web;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/bbs")
public class BbsController {
	
	@GetMapping("/list")
	public String listForm(Model model) {
		
		return "views/bbs/list";
	}

	@SuppressWarnings({ "serial", "static-access" })
	@GetMapping("/{id}")
	public @ResponseBody Map<String, Object> listForm(Model model, @PathVariable String id) throws Exception {
		
		if("error".equalsIgnoreCase(id)) {
			throw new NullPointerException();
		}
		
		if ("10sec".equalsIgnoreCase(id)) {
			try { Thread.currentThread().sleep(15 * 1000); } catch (Exception e) {}
		}
		
		Map<String, Object> r = new HashMap<String, Object>(){{
			put("id"     , id       );
			put("title"  , "title"  );
			put("content", "content");
			put("read"   , 12       );
		}};
		return r;
	}
}
