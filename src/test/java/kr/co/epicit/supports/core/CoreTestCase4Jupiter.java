package kr.co.epicit.supports.core;

import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.ui.Model;

@SpringBootTest
public abstract class CoreTestCase4Jupiter {
	public CoreTestCase4Jupiter() {
		this.setUp(); 
	}
	
	@BeforeEach
	protected void setUp() { // throws Exception {
		if (model == null) { model = Mockito.mock(Model.class); }
	}
	
	@Autowired
	protected Model model;
	
//	@Test
//	void test() {
//		assertNotNull("");;
//		fail("Not yet implemented");
//	}

}
