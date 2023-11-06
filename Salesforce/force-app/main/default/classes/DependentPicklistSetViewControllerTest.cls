@IsTest
private class DependentPicklistSetViewControllerTest {

	//There does not need to be too much detail
	//here as the DependentPicklistUtilTest covers
	//the same functionality
	//This method tests:
	//	- getAvailableValues
	//	- getMetadata (coverage only)
	@IsTest
	static void controller_Test() {

		//Create some picklist sets
		final Dependent_Picklist_Set__c
			set_green = DependentPicklistSetUtilTest.createPicklistSet('Green', null, null, true),
			set_yellow_circle = DependentPicklistSetUtilTest.createPicklistSet('Yellow', 'Circle', null, true),
			set_yellow_square = DependentPicklistSetUtilTest.createPicklistSet('Yellow', 'Square', null, true);

		final List<Dependent_Picklist_Set__c> allPicklistSets = new List<Dependent_Picklist_Set__c>{
			set_green,
			set_yellow_circle,
			set_yellow_square
		};
		insert allPicklistSets;

		final User customer = TestData.testCommunityUser();

		Test.startTest();

		//Get coverage for getMetadata (already tested in DependentPicklistUtilTest)
		DependentPicklistSetUtilTest.CollatedResult
			result_all,
			result_green,
			result_yellow,
			result_yellow_circle,
			result_yellow_square;

		DependentPicklistSetUtilTest.CollatedMultiSelectResult
			result_m_all,
			result_m_green,
			result_m_yellow,
			result_m_yellow_circle,
			result_m_yellow_square;

		System.runAs(customer) {
			DependentPicklistSetViewController.getMetadata(DependentPicklistSetUtilTest.TEST_TYPE_VALUE);
			result_all = collateFieldOptions(null, null);
			result_green = collateFieldOptions('Green', null);
			result_yellow = collateFieldOptions('Yellow', null);
			result_yellow_circle = collateFieldOptions('Yellow', 'Circle');
			result_yellow_square = collateFieldOptions('Yellow', 'Square');

			// -- collate multi select fields
			result_m_all = collateMultiSelectFieldOptions(null, null);
			result_m_green = collateMultiSelectFieldOptions(new List<String>{'Green'}, null);
			result_m_yellow = collateMultiSelectFieldOptions(new List<String>{'Yellow'}, null);
			result_m_yellow_circle = collateMultiSelectFieldOptions(new List<String>{'Yellow'}, new List<String>{'Circle'});
			result_m_yellow_square = collateMultiSelectFieldOptions(new List<String>{'Yellow'}, new List<String>{'Square'});
		}

		Test.stopTest();

		DependentPicklistSetUtilTest.testCollatedFieldOptions(
			result_all,
			allPicklistSets,
			'no selections'
		);

		DependentPicklistSetUtilTest.testCollatedMultiSelectFieldOptions(
			result_m_all,
			allPicklistSets,
			'no selections'
		);

		DependentPicklistSetUtilTest.testCollatedFieldOptions(
			result_green,
			new List<Dependent_Picklist_Set__c>{
				set_green
			},
			'result_green'
		);

		DependentPicklistSetUtilTest.testCollatedMultiSelectFieldOptions(
			result_m_green,
			new List<Dependent_Picklist_Set__c>{
				set_green
			},
			'result_green'
		);

		DependentPicklistSetUtilTest.testCollatedFieldOptions(
			result_yellow,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_circle,
				set_yellow_square
			},
			'result_yellow'
		);

		DependentPicklistSetUtilTest.testCollatedMultiSelectFieldOptions(
			result_m_yellow,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_circle,
				set_yellow_square
			},
			'result_yellow'
		);

		DependentPicklistSetUtilTest.testCollatedFieldOptions(
			result_yellow_circle,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_circle
			},
			'result_yellow_circle'
		);

		DependentPicklistSetUtilTest.testCollatedMultiSelectFieldOptions(
			result_m_yellow_circle,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_circle
			},
			'result_yellow_circle'
		);

		DependentPicklistSetUtilTest.testCollatedFieldOptions(
			result_yellow_square,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_square
			},
			'result_yellow_square'
		);

		DependentPicklistSetUtilTest.testCollatedMultiSelectFieldOptions(
			result_m_yellow_square,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_square
			},
			'result_yellow_square'
		);

	}

	@TestVisible
	private static DependentPicklistSetUtilTest.CollatedResult collateFieldOptions(String field1, String field2) {
		final List<String> selections = new List<String>();
		if (field1 != null) {
			selections.add(field1);
		}
		if (field2 != null) {
			selections.add(field2);
		}
		return new DependentPicklistSetUtilTest.CollatedResult(
			selections,
			DependentPicklistSetViewController.getAvailableValues(
				DependentPicklistSetUtilTest.TEST_TYPE_VALUE,
				JSON.serialize(selections)
			)
		);
	}

	@TestVisible
	private static DependentPicklistSetUtilTest.CollatedMultiSelectResult collateMultiSelectFieldOptions(List<String> fields1, List<String> fields2) {
		final List<List<String>> selections = new List<List<String>>();
		if (fields1 != null) {
			selections.add(fields1);
		}
		if (fields2 != null) {
			selections.add(fields2);
		}
		return new DependentPicklistSetUtilTest.CollatedMultiSelectResult(
			selections,
			DependentPicklistSetViewController.getAvailableMultiSelectValues(
				DependentPicklistSetUtilTest.TEST_TYPE_VALUE,
				JSON.serialize(selections)
			)
		);
	}

}