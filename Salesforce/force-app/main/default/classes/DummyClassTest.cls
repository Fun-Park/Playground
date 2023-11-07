@IsTest
private class DummyClassTest {
        @IsTest
	static void helperMethod_Test() {
                System.debug('test');
                Test.startTest();                
                Integer ret = DummyClass.giveMeSeven();               
                Test.stopTest();
                System.assertEquals(7, ret);
        }
}