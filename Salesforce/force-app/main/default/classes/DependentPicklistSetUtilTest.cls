@TestVisible
@IsTest
private class DependentPicklistSetUtilTest {

	@TestVisible
	private static final String TEST_TYPE_VALUE;

	static {
		for (PicklistEntry entry : Dependent_Picklist_Set__c.Type__c.getDescribe().getPicklistValues()) {
			if (entry.isActive()) {
				TEST_TYPE_VALUE = entry.getValue();
				break;
			}
		}
	}

	//Used to spoof the Field_Specification__mdt results
	private inherited sharing class MockProvider implements System.StubProvider {

		private final List<Field_Specification__mdt> specifications;

		public MockProvider(List<Field_Specification__mdt> specifications) {
			this.specifications = specifications;
		}

		public Object handleMethodCall(Object stubbedObject, String stubbedMethodName,
			Type returnType, List<Type> listOfParamTypes, List<String> listOfParamNames,
			List<Object> listOfArgs) {
			if (stubbedMethodName == 'queryFieldSpecificationsForType') {
				return specifications;
			}
			return null;
		}
	}

	//Wrapper class to make testing collated field options cleaner
	@TestVisible
	private without sharing class CollatedResult {
		public final List<String> selections { get; set; }
		public final List<List<DependentPicklistSetUtil.DependentPicklistValue>> result { get; set; }

		public CollatedResult(List<String> selections, List<List<DependentPicklistSetUtil.DependentPicklistValue>> result) {
			this.selections = selections;
			this.result = result;
		}
	}

	@TestVisible
	private without sharing class CollatedMultiSelectResult {
		public final List<List<String>> selections { get; set; }
		public final List<List<DependentPicklistSetUtil.DependentPicklistValue>> result { get; set; }

		public CollatedMultiSelectResult(List<List<String>> selections, List<List<DependentPicklistSetUtil.DependentPicklistValue>> result) {
			this.selections = selections;
			this.result = result;
		}
	}

	//Tests the following methods:
	//	1.	getFieldValueIfSet
	//	2.	buildFieldName
	//	3.	buildFieldDescriptionName
	@IsTest
	static void helperMethod_Test() {

		final User u = [
			SELECT FirstName
			FROM User
			LIMIT 1
		];

		//	1. getFieldValueIfSet
		System.assertEquals(
			u.FirstName,
			DependentPicklistSetUtil.getFieldValueIfSet(u, 'FirstName')
		);
		System.assertEquals(
			null,
			DependentPicklistSetUtil.getFieldValueIfSet(u, 'LastName')
		);

		//	2. buildFieldName
		System.assertEquals(
			'Field_126__c',
			DependentPicklistSetUtil.buildFieldName(126)
		);

		//	3. buildFieldDescriptionName
		System.assertEquals(
			'Field_45_Description__c',
			DependentPicklistSetUtil.buildFieldDescriptionName(45)
		);

	}

	//Tests the following methods:
	//	1.	countUsedFields
	//	2.	countGenericFieldsOnObject
	//	3.	countGenericFieldsUsedByType
	@IsTest
	static void counterMethod_Test() {

		//	1.	countUsedFields
		final List<String> valueList = new List<String>();
		for (Integer i = 0; i < 10; i++) {
			System.assertEquals(
				i,
				DependentPicklistSetUtil.countUsedFields(valueList)
			);
			valueList.add('data');
		}
		//Test with nulls
		System.assertEquals(
			3,
			DependentPicklistSetUtil.countUsedFields(new List<String>{
				'value 1',
				'value 2',
				'value 3',
				null,
				'value 4',
				'value 5'
			})
		);

		//	2.	countGenericFieldsOnObject
		final Integer fieldCount = countGenericFieldsOnObject();
		System.assertEquals(
			fieldCount,
			DependentPicklistSetUtil.countGenericFieldsOnObject()
		);
		System.assertEquals(
			fieldCount,
			DependentPicklistSetUtil.GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT
		);

		//	3.	countGenericFieldsUsedByType
		//Limit the number of iterations, as each iteration is DML
		final Integer maxFieldCountToUse = Math.min(
			fieldCount,
			5
		);
		for (Integer fieldCounter = 0; fieldCounter < maxFieldCountToUse; fieldCounter++) {
			System.assertEquals(
				DependentPicklistSetUtil.countGenericFieldsUsedByType(TEST_TYPE_VALUE),
				fieldCounter
			);

			final Dependent_Picklist_Set__c picklistSet = new Dependent_Picklist_Set__c(
				Type__c = TEST_TYPE_VALUE
			);
			for (Integer i = 0, j = fieldCounter + 1; i < j; i++) {
				picklistSet.put(
					DependentPicklistSetUtil.buildFieldName(i + 1),
					'value'
				);
			}
			insert picklistSet;
		}
		//Test for empty values
		delete [
			SELECT Id
			FROM Dependent_Picklist_Set__c
		];
		insert new Dependent_Picklist_Set__c(
			Type__c = TEST_TYPE_VALUE,
			Field_1__c = 'value',
			//This field should be ignored as Field_2__c is null
			Field_3__c = 'value'
		);
		System.assertEquals(
			DependentPicklistSetUtil.countGenericFieldsUsedByType(TEST_TYPE_VALUE),
			1
		);
	}
	static Integer countGenericFieldsOnObject() {
		Integer counter = 1;
		final Set<String> fieldNames = SObjectType.Dependent_Picklist_Set__c.fields.getMap().keySet();
		while (fieldNames.contains(DependentPicklistSetUtil.buildFieldName(counter).toLowerCase())) {
			counter++;
		}
		return counter - 1;
	}

	//Test method for getPicklistDefinitionsForType
	@IsTest
	static void getPicklistDefinitionsForType_Test() {

		//Work around many limitations to build the required custom
		//metadata for testing
		final Map<String, FieldDefinition> fieldNameToFieldDefinition = getFieldNameToFieldDefinition(new List<String>{
			'Field_1__c',
			'Field_2__c',
			'Field_3__c'
		});
		final List<Field_Specification__mdt> fieldSpecifications = new List<Field_Specification__mdt>{
			buildSpecification(fieldNameToFieldDefinition.get('Field_1__c'), 'Label 1'),
			buildSpecification(fieldNameToFieldDefinition.get('Field_2__c'), 'Label 2'),
			buildSpecification(fieldNameToFieldDefinition.get('Field_3__c'), 'Label 3')
		};

		//Add a record (for "countGenericFieldsUsedByType")
		insert new Dependent_Picklist_Set__c(
			Type__c = TEST_TYPE_VALUE,
			Field_1__c = 'value',
			Field_2__c = 'value',
			Field_3__c = 'value'
		);

		//Run this once, so the mocked method (just a query) gets coverage
		DependentPicklistSetUtil.getPicklistDefinitionsForType(TEST_TYPE_VALUE);

		Test.startTest();

		//Good old dependency injection
		//Scenario 1: No fields used
		final List<DependentPicklistSetUtil.DependentPicklistDefinition> results_noFieldsUsed = DependentPicklistSetUtil.getPicklistDefinitionsForType('Does not exist hsuiofj3');

		//Scenario 2: No results
		DependentPicklistSetUtil.instance = (DependentPicklistSetUtil) Test.createStub(
			DependentPicklistSetUtil.class,
			new MockProvider(new List<Field_Specification__mdt>())
		);
		final List<DependentPicklistSetUtil.DependentPicklistDefinition> results_noMatch = DependentPicklistSetUtil.getPicklistDefinitionsForType(TEST_TYPE_VALUE);

		//Scenario 3: Has results
		DependentPicklistSetUtil.instance = (DependentPicklistSetUtil) Test.createStub(
			DependentPicklistSetUtil.class,
			new MockProvider(fieldSpecifications)
		);

		Test.stopTest();
		final List<DependentPicklistSetUtil.DependentPicklistDefinition> results_hasMatch = DependentPicklistSetUtil.getPicklistDefinitionsForType(TEST_TYPE_VALUE);

		System.assertEquals(
			3,
			DependentPicklistSetUtil.countGenericFieldsUsedByType(TEST_TYPE_VALUE)
		);

		//Scenario 1: No fields used
		System.assertEquals(0, results_noFieldsUsed.size(), results_noFieldsUsed);

		//Scenario 2: No results
		System.assertEquals(3, results_noMatch.size(), results_noMatch);

		Integer fieldNumber = 0;
		for (DependentPicklistSetUtil.DependentPicklistDefinition definition : results_noMatch) {
			fieldNumber++;
			final String fieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber);
			final String fieldLabel = 'Field ' + fieldNumber;
			System.assertEquals(fieldNumber, definition.fieldNumber, definition);
			System.assertEquals(fieldName, definition.fieldName, definition);
			System.assertEquals(fieldLabel, definition.fieldLabel, definition);
			System.assertEquals(fieldLabel, definition.fieldAccessibilityLabel, definition);
		}

		//Scenario 3: Has results
		System.assertEquals(3, results_hasMatch.size(), results_hasMatch);

		fieldNumber = 0;
		for (DependentPicklistSetUtil.DependentPicklistDefinition definition : results_hasMatch) {
			fieldNumber++;
			final String fieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber);
			final String fieldLabel = 'Label ' + fieldNumber;
			System.assertEquals(fieldNumber, definition.fieldNumber, definition);
			System.assertEquals(fieldName, definition.fieldName, definition);
			System.assertEquals(fieldLabel, definition.fieldLabel, definition);
			System.assertEquals(fieldLabel, definition.fieldAccessibilityLabel, definition);
		}
	}

	//Test method for collateFieldOptions
	@IsTest
	static void collateFieldOptions_Test() {

		final Dependent_Picklist_Set__c
			//Blue fields (popup)
			set_blue_circle_filled = createPicklistSet('Blue', 'Circle', 'Filled', true),
			set_blue_circle_empty = createPicklistSet('Blue', 'Circle', 'Empty', true),
			set_blue_square_filled = createPicklistSet('Blue', 'Square', 'Filled', true),
			set_blue_square_empty = createPicklistSet('Blue', 'Square', 'Empty', true),

			//Green fields (complete)
			set_green_circle = createPicklistSet('Green', 'Circle', null, false),
			set_green_square = createPicklistSet('Green', 'Square', null, false),
			set_green_triangle = createPicklistSet('Green', 'Triangle', null, false),

			//Yellow fields (popup)
			set_yellow_circle = createPicklistSet('Yellow', 'Circle', null, true),
			set_yellow_square = createPicklistSet('Yellow', 'Square', null, true);

		final List<Dependent_Picklist_Set__c> allDependentPicklistSets = new List<Dependent_Picklist_Set__c>{
			set_blue_circle_filled,
			set_blue_circle_empty,
			set_blue_square_filled,
			set_blue_square_empty,

			set_green_circle,
			set_green_square,
			set_green_triangle,

			set_yellow_circle,
			set_yellow_square
		};
		insert allDependentPicklistSets;

		Test.startTest();

		final CollatedResult
			result = collateFieldOptions(),

			result_blue = collateFieldOptions('Blue'),
			result_blue_circle = collateFieldOptions('Blue', 'Circle'),
			result_blue_circle_filled = collateFieldOptions('Blue', 'Circle', 'Filled'),
			result_blue_square = collateFieldOptions('Blue', 'Square'),
			result_blue_square_empty = collateFieldOptions('Blue', 'Square', 'Empty'),

			result_green = collateFieldOptions('Green'),
			result_green_circle = collateFieldOptions('Green', 'Circle'),
			result_green_triangle = collateFieldOptions('Green', 'Triangle'),

			result_yellow_circle = collateFieldOptions('Yellow', 'Circle');

		Test.stopTest();

		//Test unfiltered results
		testCollatedFieldOptions(
			result,
			allDependentPicklistSets,
			'no selections'
		);

		//Test for 'Blue'
		testCollatedFieldOptions(
			result_blue,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty,
				set_blue_square_filled,
				set_blue_square_empty
			},
			'result_blue'
		);
		//Test for 'Blue' -> 'Circle'
		testCollatedFieldOptions(
			result_blue_circle,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty
			},
			'result_blue_circle'
		);
		//Test for 'Blue' -> 'Circle' -> 'Filled'
		testCollatedFieldOptions(
			result_blue_circle_filled,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled
			},
			'result_blue_circle_filled'
		);
		//Test for 'Blue' -> 'Square'
		testCollatedFieldOptions(
			result_blue_square,
			new List<Dependent_Picklist_Set__c>{
				set_blue_square_filled,
				set_blue_square_empty
			},
			'result_blue_square'
		);
		//Test for 'Blue' -> 'Square' -> 'Empty'
		testCollatedFieldOptions(
			result_blue_square_empty,
			new List<Dependent_Picklist_Set__c>{
				set_blue_square_filled,
				set_blue_square_empty
			},
			'result_blue_square_empty'
		);

		//Test for 'Green'
		testCollatedFieldOptions(
			result_green,
			new List<Dependent_Picklist_Set__c>{
				set_green_circle,
				set_green_square,
				set_green_triangle
			},
			'result_green'
		);
		//Test for 'Green' -> 'Circle'
		testCollatedFieldOptions(
			result_green_circle,
			new List<Dependent_Picklist_Set__c>{
				set_green_circle
			},
			'result_green_circle'
		);
		//Test for 'Green' -> 'Triangle'
		testCollatedFieldOptions(
			result_green_triangle,
			new List<Dependent_Picklist_Set__c>{
				set_green_triangle
			},
			'result_green_triangle'
		);

		//Test for 'Yellow' -> 'Circle'
		testCollatedFieldOptions(
			result_yellow_circle,
			new List<Dependent_Picklist_Set__c>{
				set_yellow_circle
			},
			'result_yellow_circle'
		);

	}

	//Test method for collateMultiSelectFieldOptions
	@IsTest
	static void collateMultiSelectFieldOptions_Test() {

		final Dependent_Picklist_Set__c
			//Blue fields (popup)
			set_blue_circle_filled = createPicklistSet('Blue', 'Circle', 'Filled', true),
			set_circle_circle_filled = createPicklistSet('Circle', 'Circle', 'Filled', true),
			set_filled_circle_filled = createPicklistSet('Filled', 'Circle', 'Filled', true),
			set_empty_circle_empty = createPicklistSet('Empty', 'Circle', 'Filled', true),

			set_blue_circle_empty = createPicklistSet('Blue', 'Circle', 'Empty', true),
			set_blue_square_filled = createPicklistSet('Blue', 'Square', 'Filled', true),
			set_blue_square_empty = createPicklistSet('Blue', 'Square', 'Empty', true),
			set_blue_blue_empty = createPicklistSet('Blue', 'Blue', 'Empty', true),
			set_blue_filled_empty = createPicklistSet('Blue', 'Filled', 'Empty', true),

			set_blue_square_blue = createPicklistSet('Blue', 'Square', 'Blue', true),
			set_blue_square_circle = createPicklistSet('Blue', 'Square', 'Circle', true),

			//Green fields (complete)
			set_green_circle = createPicklistSet('Green', 'Circle', null, false),
			set_green_square = createPicklistSet('Green', 'Square', null, false),
			set_green_triangle = createPicklistSet('Green', 'Triangle', null, false),

			//Yellow fields (popup)
			set_yellow_circle = createPicklistSet('Yellow', 'Circle', null, true),
			set_yellow_square = createPicklistSet('Yellow', 'Square', null, true);

		final List<Dependent_Picklist_Set__c> allDependentPicklistSets = new List<Dependent_Picklist_Set__c>{
			set_blue_circle_filled,
			set_blue_circle_empty,
			set_blue_square_filled,
			set_blue_square_empty,

			set_green_circle,
			set_green_square,
			set_green_triangle,

			set_yellow_circle,
			set_yellow_square
		};
		insert allDependentPicklistSets;

		Test.startTest();
		final CollatedMultiSelectResult
			result = collateMultiSelectFieldOptions(),
			result_blue = collateMultiSelectFieldOptions(new List<String>{'Blue'}),
			result_bluecirclefilled = collateMultiSelectFieldOptions(new List<String>{'Blue','Circle','Filled'}),

			result_blue_circle = collateMultiSelectFieldOptions(new List<String>{'Blue'}, new List<String>{'Circle'}),
			result_blue_bluecirclefilled = collateMultiSelectFieldOptions(new List<String>{'Blue'}, new List<String>{'Blue','Circle','Filled'}),

			result_blue_circle_filled = collateMultiSelectFieldOptions(new List<String>{'Blue'}, new List<String>{'Circle'}, new List<String>{'Filled'}),
			result_blue_circle_bluecirclefilled = collateMultiSelectFieldOptions(new List<String>{'Blue'}, new List<String>{'Circle'}, new List<String>{'Blue','Circle','Filled'}),

			result_blue_square = collateMultiSelectFieldOptions(new List<String>{'Blue'}, new List<String>{'Square'}),
			result_blue_square_empty = collateMultiSelectFieldOptions(new List<String>{'Blue'},  new List<String>{'Square'}, new List<String>{'Empty'}),

			result_green = collateMultiSelectFieldOptions(new List<String>{'Green'}),
			result_green_circle = collateMultiSelectFieldOptions(new List<String>{'Green'}, new List<String>{'Circle'}),
			result_green_triangle = collateMultiSelectFieldOptions(new List<String>{'Green'},  new List<String>{'Triangle'}),

			result_yellow_circle = collateMultiSelectFieldOptions(new List<String>{'Yellow'}, new List<String>{'Circle'});

		Test.stopTest();

		//Test unfiltered results [],[],[]
		testCollatedMultiSelectFieldOptions(
			result,
			allDependentPicklistSets,
			'no selections'
		);
		//Test for ['Blue'],[],[]
		testCollatedMultiSelectFieldOptions(
			result_blue,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty,
				set_blue_square_filled,
				set_blue_square_empty
			},
			'result_blue'
		);

		//Test for multi select ['blue,circle,filled'],[],[]
		testCollatedMultiSelectFieldOptions(
			result_bluecirclefilled,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty,
				set_blue_square_filled,
				set_blue_square_empty,
				set_circle_circle_filled,
				set_filled_circle_filled
			},
			'result_bluecirclefilled'
		);
		//Test for multi select ['blue'], ['blue,circle,filled'],[]
		testCollatedMultiSelectFieldOptions(
			result_blue_bluecirclefilled,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty,
				set_blue_square_filled,
				set_blue_square_empty,
				set_circle_circle_filled,
				set_filled_circle_filled,
				set_blue_blue_empty,
				set_blue_filled_empty
			},
			'result_blue_bluecirclefilled'
		);

		//Test for multi select ['blue'], ['circle'], ['blue,circle,filled']
		testCollatedMultiSelectFieldOptions(
			result_blue_circle_bluecirclefilled,
			new List<Dependent_Picklist_Set__c>{
				set_blue_circle_filled,
				set_blue_circle_empty,
				set_blue_square_filled,
				set_blue_square_empty,
				set_circle_circle_filled,
				set_filled_circle_filled,
				set_blue_blue_empty,
				set_blue_filled_empty,
				set_blue_square_blue,
				set_blue_square_circle
			},
			'result_blue_circle_bluecirclefilled'
		);
	}

	//Generates a Field_Specification__mdt record
	@TestVisible
	private static Field_Specification__mdt buildSpecification(FieldDefinition field, String label) {
		final Map<String, Object> outerMap = new Map<String, Object>{
			'Label__c' => label,
			'Field__r' => field
		};
		return (Field_Specification__mdt) JSON.deserialize(
			JSON.serialize(outerMap),
			Field_Specification__mdt.class
		);
	}

	//Queries a set of FieldDefinitions, required for generating a
	//Field_Specification__mdt record.
	@TestVisible
	private static Map<String, FieldDefinition> getFieldNameToFieldDefinition(List<String> fields) {
		final Map<String, FieldDefinition> fieldNameToFieldDefinition = new Map<String, FieldDefinition>();
		for (FieldDefinition definition : [
			SELECT DataType, Description, DeveloperName, DurableId, EntityDefinitionId,
				Label, QualifiedApiName
			FROM FieldDefinition
			WHERE EntityDefinition.QualifiedApiName = 'Dependent_Picklist_Set__c'
			AND QualifiedApiName IN :fields
		]) {
			fieldNameToFieldDefinition.put(definition.QualifiedApiName, definition);
		}
		return fieldNameToFieldDefinition;
	}

	//Convenience method to enhance test readability by creating records
	//in a predictable way.
	@TestVisible
	private static Dependent_Picklist_Set__c createPicklistSet(String field1, String field2, String field3, Boolean isPopup) {
		final List<String> fieldValues = new List<String>{
			field1,
			field2,
			field3
		};
		System.assert(
			!fieldValues.contains('  '),
			'Invalid fields.  Cannot have a blank field followed by a non-blank. Provided: "'
				+ String.join(fieldValues, '", "') + '".'
		);
		final String normalizedFieldValues = String.join(fieldValues, ' ').normalizeSpace();
		return new Dependent_Picklist_Set__c(
			Type__c = TEST_TYPE_VALUE,
			Field_1__c = field1,
			Field_2__c = field2,
			Field_3__c = field3,
			Field_1_Description__c = field1 == null
				? 'Empty 1'
				: 'Filled 1',
			Field_2_Description__c = field2 == null
				? 'Empty 2'
				: 'Filled 2',
			Field_3_Description__c = field3 == null
				? 'Empty 3'
				: 'Filled 3',
			Action_Type__c = isPopup
				? 'Popup'
				: 'Complete',
			Action_Label__c = normalizedFieldValues,
			Action_Body__c = 'Body: ' + normalizedFieldValues
		);
	}

	//Convenience methods to enhance test readability
	private static CollatedResult collateFieldOptions() {
		return collateFieldOptions(null, null, null);
	}
	private static CollatedResult collateFieldOptions(String field1) {
		return collateFieldOptions(field1, null, null);
	}
	private static CollatedResult collateFieldOptions(String field1, String field2) {
		return collateFieldOptions(field1, field2, null);
	}
	private static CollatedResult collateFieldOptions(String field1, String field2, String field3) {
		final List<String> selections = new List<String>{
			field1,
			field2,
			field3
		};
		final Set<String> cleanedSelections = new Set<String>(selections);
		cleanedSelections.remove(null);
		return new CollatedResult(
			new List<String>(selections),
			DependentPicklistSetUtil.collateFieldOptions(
				TEST_TYPE_VALUE,
				selections
			)
		);
	}
	private static CollatedMultiSelectResult collateMultiSelectFieldOptions() {
		return collateMultiSelectFieldOptions(new List<String>(), new List<String>(), new List<String>());
	}
	private static CollatedMultiSelectResult collateMultiSelectFieldOptions(List<String> fields1) {
		return collateMultiSelectFieldOptions(fields1, new List<String>(), new List<String>());
	}
	private static CollatedMultiSelectResult collateMultiSelectFieldOptions(List<String> fields1, List<String> fields2) {
		return collateMultiSelectFieldOptions(fields1, fields2, new List<String>());
	}
	private static CollatedMultiSelectResult collateMultiSelectFieldOptions(List<String> fields1, List<String> fields2, List<String> fields3) {
		final List<List<String>> selections = new List<List<String>>{
			fields1,
			fields2,
			fields3
		};
		return new CollatedMultiSelectResult(
			new List<List<String>>(selections),
			DependentPicklistSetUtil.collateMultiSelectFieldOptions(
				TEST_TYPE_VALUE,
				selections
			)
		);
	}

	//Tests that collateFieldOptions results are correct
	@TestVisible
	private static void testCollatedFieldOptions(CollatedResult results, List<Dependent_Picklist_Set__c> resultPicklistSets, String identifier) {
		final List<String> selections = results.selections;
		final List<List<DependentPicklistSetUtil.DependentPicklistValue>> picklistsWithValues = new List<List<DependentPicklistSetUtil.DependentPicklistValue>>(results.result);
		final Integer picklistCount = picklistsWithValues.size();
		final Integer selectionCount = selections.size();

		final Boolean expectComplete = resultPicklistSets.size() == 1;
		final Dependent_Picklist_Set__c onlyOption = expectComplete
			? resultPicklistSets[0]
			: null;

		//The field index (not number) - i.e. 0..n
		Boolean hadCompleteSelection = false;
		Integer fieldIndex = 0;
		final List<String> descriptionBuilder = new List<String>();
		for (List<DependentPicklistSetUtil.DependentPicklistValue> values : picklistsWithValues) {

			final String currentSelection = fieldIndex < selectionCount
				? selections[fieldIndex]
				: null;
			//Add the selection to the description list, unless it is null or the
			//final picklist in the array.  We ignore the last one as it could be
			//indicative of bad test values - and not a bug.
			if (currentSelection != null && fieldIndex < picklistCount) {
				descriptionBuilder.add(currentSelection);
			}
			final String allValues = String.join(descriptionBuilder, ' ');

			//Field number - 1..n
			final Integer fieldNumber = fieldIndex + 1;
			final String fieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber);

			String actionType = null;
			Boolean isCompleteSelection = false;
			if (onlyOption != null) {
				final String nextFieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber + 1);
				actionType = onlyOption.Action_Type__c;
				if (DependentPicklistSetUtil.getFieldValueIfSet(onlyOption, nextFieldName) == null) {
					isCompleteSelection = true;
					hadCompleteSelection = true;
				}
			}

			//Get all record values for this field
			final Set<String> resultPicklistSetValues = new Set<String>();
			for (Dependent_Picklist_Set__c picklistSet : resultPicklistSets) {
				resultPicklistSetValues.add((String) picklistSet.get(fieldName));
			}
			resultPicklistSetValues.remove(null);

			//For all but the last picklist (which have one entry more than
			//the selections - assuming the selected values are valid).
			if (fieldIndex < picklistCount - 1) {
				System.assertNotEquals(
					null,
					currentSelection,
					'Expecting a selection for field ' + fieldNumber + ' and identifier ' + identifier
				);
			}

			for (DependentPicklistSetUtil.DependentPicklistValue value : values) {
				System.assertEquals(fieldNumber, value.level, identifier);
				System.assert(
					resultPicklistSetValues.contains(value.value),
					'Expected "' + value.value + '" to exist in "'
						+ String.join(new List<String>(resultPicklistSetValues), '", "')
						+ '" for identifier: ' + identifier
				);
				System.assertEquals(value.value, value.label, identifier);
				System.assertEquals('Filled ' + fieldNumber, value.description, identifier);
				if (isCompleteSelection) {
					System.assertEquals(actionType, value.actionType, identifier);
					System.assertEquals(allValues, value.actionLabel, identifier);
					System.assertEquals('Body: ' + allValues, value.actionBody, identifier);
				}
			}

			fieldIndex++;
		}

		System.assertEquals(expectComplete, hadCompleteSelection, 'Expected a completed selection for identifier: ' + identifier);

	}

	//Tests that testCollatedMultiSelectFieldOptions results are correct
	@TestVisible
	private static void testCollatedMultiSelectFieldOptions(CollatedMultiSelectResult results, List<Dependent_Picklist_Set__c> resultPicklistSets, String identifier) {
		final List<List<String>> selections = results.selections;
		final List<List<DependentPicklistSetUtil.DependentPicklistValue>> picklistsWithValues = new List<List<DependentPicklistSetUtil.DependentPicklistValue>>(results.result);
		final Integer picklistCount = picklistsWithValues.size();
		final Integer selectionCount = selections.size();

		final Boolean expectComplete = resultPicklistSets.size() == 1;
		final Dependent_Picklist_Set__c onlyOption = expectComplete
			? resultPicklistSets[0]
			: null;

		//The field index (not number) - i.e. 0..n
		Boolean hadCompleteSelection = false;
		Integer fieldIndex = 0;
		final List<String> descriptionBuilder = new List<String>();

		for (List<DependentPicklistSetUtil.DependentPicklistValue> values : picklistsWithValues) {
			final List<String> currentSelections = fieldIndex < selectionCount
				? selections[fieldIndex]
				: null;
			//Add the selection to the description list, unless it is null or the
			//final picklist in the array.  We ignore the last one as it could be
			//indicative of bad test values - and not a bug.
			if (currentSelections != null && currentSelections.size() > 0 && fieldIndex < picklistCount) {
				descriptionBuilder.addAll(currentSelections);
			}
			final String allValues = String.join(descriptionBuilder, ' ');



			//Field number - 1..n
			final Integer fieldNumber = fieldIndex + 1;
			final String fieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber);

			String actionType = null;
			Boolean isCompleteSelection = false;
			if (onlyOption != null) {
				final String nextFieldName = DependentPicklistSetUtil.buildFieldName(fieldNumber + 1);
				actionType = onlyOption.Action_Type__c;
				if (DependentPicklistSetUtil.getFieldValueIfSet(onlyOption, nextFieldName) == null) {
					isCompleteSelection = true;
					hadCompleteSelection = true;
				}
			}

			//Get all record values for this field
			final Set<String> resultPicklistSetValues = new Set<String>();
			for (Dependent_Picklist_Set__c picklistSet : resultPicklistSets) {
				resultPicklistSetValues.add((String) picklistSet.get(fieldName));
			}
			resultPicklistSetValues.remove(null);

			//For all but the last picklist (which have one entry more than
			//the selections - assuming the selected values are valid).
			if (fieldIndex < picklistCount - 1) {
				System.assertNotEquals(
					null,
					currentSelections[0],
					'Expecting a selection for field ' + fieldNumber + ' and identifier ' + identifier
				);
			}

			for (DependentPicklistSetUtil.DependentPicklistValue value : values) {
				System.assertEquals(fieldNumber, value.level, identifier);
				System.assert(
					resultPicklistSetValues.contains(value.value),
					'Expected "' + value.value + '" to exist in "'
						+ String.join(new List<String>(resultPicklistSetValues), '", "')
						+ '" for identifier: ' + identifier
				);
				System.assertEquals(value.value, value.label, identifier);
				System.assertEquals('Filled ' + fieldNumber, value.description, identifier);
				if (isCompleteSelection) {
					System.assertEquals(actionType, value.actionType, identifier);
					System.assertEquals(allValues, value.actionLabel, identifier);
					System.assertEquals('Body: ' + allValues, value.actionBody, identifier);
				}
			}

			fieldIndex++;
		}
		System.assertEquals(expectComplete, hadCompleteSelection, 'Expected a completed selection for identifier: ' + identifier);
	}

}