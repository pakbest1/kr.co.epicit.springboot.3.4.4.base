package kr.co.epicit.app.bbs.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import kr.co.epicit.supports.core.CoreTestCase4Jupiter;

//@SpringBootTest
@WebMvcTest
public class BbsControllerTest extends CoreTestCase4Jupiter {
	Logger logger = LoggerFactory.getLogger(this.getClass());
	public BbsControllerTest() {
		super();
	}
	
	@BeforeEach
	protected void setUp() {
		super.setUp();
//		this.model = super.model;
	}
//	
//	private Model model;
	
	@Autowired
	BbsController bbsController;
	
	@Autowired
	private MockMvc mockMvc;
	
	@Test
	public void test01() throws Exception {
		//bbsController.listForm(model);
		mockMvc.perform(get("/bbs/list")).andExpect(status().isOk());

		
	}
}
