
public class TestMain {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		String ptrn = "\n\n\t\t <hello #{project} />";
		System.out.println(ptrn.replaceAll("\\#\\{project\\}","\"프로젝트\""));
	}

}
