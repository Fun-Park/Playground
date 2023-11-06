/**
 * Utilities that facilitate the Dependent Picklist facility (NWIG-1).
 */
public without sharing class DependentPicklistSetUtil {

	//For test dependency injection...
	@TestVisible
	private static DependentPicklistSetUtil instance = new DependentPicklistSetUtil();

	/**
	 * Lazy load and store the number of generic "Field_#__c" fields
	 * that exist on the `Dependent_Picklist__c` object.
	 */
	public static final Integer GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT {
		get {
			if (GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT == null) {
				GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT = countGenericFieldsOnObject();
			}
			return GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT;
		}
		private set;
	}

	/**
	 * Defines a single picklist in a picklist set.
	 */
	public without sharing class DependentPicklistDefinition {

		/**
		 * The related field API name (e.g. Field_1__c).
		 */
		@AuraEnabled public final String fieldName { get; set; }

		/**
		 * The field label to display.
		 */
		@AuraEnabled public final String fieldLabel { get; set; }

		/**
		 * A text-only label used for accessibility.
		 */
		@AuraEnabled public final String fieldAccessibilityLabel { get; set; }

		/**
		 * The field number (1..n).
		 */
		@AuraEnabled public final Integer fieldNumber { get; set; }

		/**
		 * Constructor to use when there exists a matching Field
		 * Specification record.
		 *
		 * @param specification
		 * 		The field specification record for this field and type.
		 */
		private DependentPicklistDefinition(Field_Specification__mdt specification) {
			fieldName = specification.Field__r.QualifiedApiName;
			fieldLabel = specification.Label__c;
			fieldAccessibilityLabel = fieldLabel;
			fieldNumber = Integer.valueOf(
				fieldName.removeStartIgnoreCase('Field_').removeEndIgnoreCase('__c')
			);
		}

		/**
		 * Manual constructor to use when there exists no matching
		 * Field Specification record.
		 *
		 * @param fieldName
		 * 		The field's API name (e.g. Field_1__c)
		 * @param fieldLabel
		 * 		The field label to show (e.g. Field 1)
		 * @param fieldNumber
		 * 		The field number (1..n).
		 */
		private DependentPicklistDefinition(String fieldName, String fieldLabel, Integer fieldNumber) {
			this.fieldName = fieldName;
			this.fieldLabel = fieldLabel;
			fieldAccessibilityLabel = fieldLabel;
			this.fieldNumber = fieldNumber;
		}
	}

	/**
	 * Defines a single option within a picklist.
	 */
	public without sharing class DependentPicklistValue {

		@AuraEnabled
		public final String label { get; set; }

		@AuraEnabled
		public final String value { get; set; }

		@AuraEnabled
		public final Integer level { get; set; }

		@AuraEnabled
		public final String description { get; set; }

		@AuraEnabled
		public String actionType { get; set; }

		@AuraEnabled
		public String actionLabel { get; set; }

		@AuraEnabled
		public String actionBody { get; set; }

		/**
		 * @param record
		 * 		A single Dependent Picklist Set record.
		 *
		 * @param fieldNumber
		 * 		The field number this instance represents (1..n).
		 */
		private DependentPicklistValue(Dependent_Picklist_Set__c record, Integer fieldNumber) {
			//Extract the field value and description if any
			value = (String) record.get(buildFieldName(fieldNumber));
			label = value;
			level = fieldNumber;
			final String descriptionField = buildFieldDescriptionName(fieldNumber);
			description = record.isSet(descriptionField)
				? (String) record.get(descriptionField)
				: null;

			//Only apply the action to the last field in the picklist set
			if (record.Action_Type__c != null) {
				if (fieldNumber == GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT || getFieldValueIfSet(record, buildFieldName(fieldNumber + 1)) == null) {
					actionType = record.Action_Type__c;
					actionLabel = record.Action_Label__c;
					actionBody = record.Action_Body__c;
				}
			}
		}
	}

	//Exists for dependency injection.  This has to be public due
	//to one of the many stub API limitations.
	public List<Field_Specification__mdt> queryFieldSpecificationsForType(String type) {
		return [
			//Note that we could filter by: Field__r.QualifiedApiName IN :fieldNames
			//However, this will cause a QUERY_TO_COMPLICATED exception, so we probably
			//don't want to do that.
			SELECT Field__r.QualifiedApiName, Label__c
			FROM Field_Specification__mdt
			WHERE Type__c = :type
			AND Object__r.QualifiedApiName = 'Dependent_Picklist_Set__c'
		];
	}

	@TestVisible
	private static String getFieldValueIfSet(SObject record, String fieldName) {
		if (record.isSet(fieldName)) {
			return (String) record.get(fieldName);
		}
		return null;
	}

	/**
	 * Builds a generic field API name (e.g. Field_1__c) from a field
	 * number.
	 * @param fieldNumber
	 * 		The field number of this field (1..n).  For example,
	 * 		Field_2__c has a field number of 2.
	 *
	 * @return
	 * 		The field's API name.
	 */
	public static String buildFieldName(Integer fieldNumber) {
		return 'Field_' + String.valueOf(fieldNumber) + '__c';
	}

	/**
	 * Builds a generic field description API name (e.g. Field_1_Description__c)
	 * from a field number.
	 * @param fieldNumber
	 * 		The field number of this field (1..n).  For example,
	 * 		Field_2_Description__c has a field number of 2.
	 *
	 * @return
	 * 		The field's description API name.
	 */
	public static String buildFieldDescriptionName(Integer fieldNumber) {
		return 'Field_' + String.valueOf(fieldNumber) + '_Description__c';
	}

	/**
	 * Counts the number of uninterrupted non-blank strings in
	 * a supplied list of strings.
	 * <p/>
	 * This method is used to count the user-made selections
	 * which are sent back to the controller as a list where
	 * each value is either a string or undefined.
	 *
	 * @param values
	 * 		A list of strings that may contain NULLs.  This
	 * 		parameter is null-safe.
	 *
	 * @return
	 * 		The number of uninterrupted non-blank strings in
	 * 		the supplied list of strings.
	 */
	@TestVisible
	private static Integer countUsedFields(List<String> values) {
		if (values == null) {
			return 0;
		}
		Integer counter = 0;
		for (String value : values) {
			if (String.isBlank(value)) {
				break;
			}
			counter++;
		}
		return counter;
	}

	@TestVisible
	private static Integer countUsedMultiSelectFields(List<List<String>> values) {
		if (values == null) {
			return 0;
		}
		Integer counter = 0;
		for (List<String> valueList : values) {
			if (valueList.isEmpty() || valueList == null || String.isBlank(valueList[0])) {
				break;
			}
			counter++;
		}
		return counter;
	}


	/**
	 * Counts the Field_#__c fields on Dependent_Picklist_Set__c.  Returns
	 * that count.  This method assumes that there are no gaps in the visible
	 * fields (e.g. Field_1__c, Field_4__c, Field_5__c is an example of a
	 * considerable gap).
	 *
	 * It is preferable to refer to the value cached under the
	 * `GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT` constant rather than
	 * use this uncached method.
	 *
	 * @return The number of Field_#__c fields on Dependent_Picklist_Set__c.
	 */
	@TestVisible
	private static Integer countGenericFieldsOnObject() {
		Integer max = 0;
		for (String fieldName : SObjectType.Dependent_Picklist_Set__c.fields.getMap().keySet()) {
			if (fieldName.startsWithIgnoreCase('Field_')) {
				final String trimmedFieldName = fieldName.removeStartIgnoreCase('Field_')
					.removeEndIgnoreCase('__c');
				if (trimmedFieldName.isNumeric()) {
					max = Math.max(
						max,
						Integer.valueOf(trimmedFieldName)
					);
				}
			}
		}
		return max;
	}

	/**
	 * Returns the maximum number of fields used by a specific Dependent
	 * Picklist Set type (i.e. Dependent_Picklist_Set__c.Type__c).
	 *
	 * @param type
	 * 		The type to filter by.
	 *
	 * @return
	 * 		The maximum number of generic fields used by any records of
	 * 		the given type.
	 */
	public static Integer countGenericFieldsUsedByType(String type) {

		//Build the query SELECT and ORDER BY sections
		final List<String> fields = new List<String>();
		for (Integer i = 0; i < GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT; i++) {
			fields.add(buildFieldName(i + 1));
		}
		//We need to ORDER BY from the highest field to the lowest
		final List<String> orders = new List<String>();
		for (Integer i = GENERIC_DEPENDENT_PICKLIST_FIELD_COUNT - 1; i > -1; i--) {
			orders.add(fields[i] + ' NULLS LAST');
		}

		//Retrieve the most-complete (i.e. most filled generic fields) record
		//of the given type.  For example:
		//	SELECT Field_1__c, Field_2__c, ..., Field_n__c
		//	FROM Dependent_Picklist_Set__c
		//	WHERE Type__c = :type
		//	ORDER BY Field_n__c NULLS LAST,
		//		...
		//		Field_2__c NULLS LAST,
		//		Field_1__c NULLS LAST
		final List<Dependent_Picklist_Set__c> fieldAggregates = Database.query(
			'SELECT ' + String.join(fields, ', ') + ' '
				+ 'FROM Dependent_Picklist_Set__c '
				+ 'WHERE Type__c = :type '
				+ 'ORDER BY ' + String.join(orders, ', ') + ' '
				+ 'LIMIT 1'
		);
		if (fieldAggregates.isEmpty()) {
			return 0;
		}
		final Dependent_Picklist_Set__c result = fieldAggregates[0];

		//Count the number of fields populated in the result record.
		Integer fieldCounter = 0;
		for (String fieldName : fields) {
			if (String.isBlank((String) result.get(fieldName))) {
				break;
			}
			fieldCounter++;
		}
		return fieldCounter;
	}

	/**
	 * Returns a list of Dependent Picklist Definition instances for a
	 * Dependent Picklist of a given type.
	 *
	 * @param type
	 * 		The dependent picklist type to query (e.g.
	 * 		Dependent_Picklist_Set__c.Type__c).
	 *
	 * @return
	 * 		The picklist definitions for the chosen picklist set type.
	 */
	public static List<DependentPicklistDefinition> getPicklistDefinitionsForType(String type) {

		//Get the number of fields actually used by the given type
		final Integer fieldCount = countGenericFieldsUsedByType(type);
		final List<DependentPicklistDefinition> definitions = new List<DependentPicklistDefinition>();
		if (fieldCount == 0) {
			return definitions;
		}

		//Build a list of the API names of each potentially populated
		//generic field.
		final List<String> fieldNames = new List<String>();
		for (Integer i = 0; i < fieldCount; i++) {
			fieldNames.add(buildFieldName(i + 1));
		}

		//Query the field specifications for this type and map them to
		//their related field API names.
		final Map<String, DependentPicklistDefinition> fieldNameToDefinition = new Map<String, DependentPicklistDefinition>();
		//Not a great fan of this, but until custom metadata can be changed for
		//a test class, dependency injection is the only way.
		for (Field_Specification__mdt specification : instance.queryFieldSpecificationsForType(type)) {
			fieldNameToDefinition.put(
				specification.Field__r.QualifiedApiName,
				new DependentPicklistDefinition(specification)
			);
		}

		//Construct the field definition wrappers for each field (creating generic
		//ones where there is no Field Specification defined).
		Integer fieldCounter = 0;
		for (String fieldName : fieldNames) {
			fieldCounter++;
			final DependentPicklistDefinition definition = fieldNameToDefinition.get(fieldName);
			definitions.add(
				definition == null
					? new DependentPicklistDefinition(
					fieldName,
					'Field ' + String.valueOf(fieldCounter),
					fieldCounter
				) : definition
			);
		}

		return definitions;
	}

	/**
	 * Returns the available options for each picklist within a
	 * dependent picklist set given the provided values are
	 * already selected.
	 *
	 * @param type
	 *		The dependent picklist type to query (e.g.
	 * 		Dependent_Picklist_Set__c.Type__c).
	 *
	 * @param selections
	 * 		A list of string values that are already selected.  Each
	 * 		item in the list may be a string or a null value, with
	 * 		each index corresponding to a picklist field within the
	 * 		set (e.g. index 2 will refer to the selected value of
	 * 		Field_3__c).
	 *
	 * @return
	 * 		A list of available values for each picklist in the set.
	 * 		The first (i.e. index 0) of the outer array will contain
	 * 		the values available for Field_1__c's picklist, and so forth.
	 * 		<p/>
	 * 		Note that the final entry in the array will also be
	 * 		filtered, so client-side logic is still required to
	 * 		provide a seamless user experience.
	 */
	public static List<List<DependentPicklistValue>> collateFieldOptions(String type, List<String> selections) {

		//Get the number of fields that need to be considered.
		final Integer availableFieldCount = countGenericFieldsUsedByType(type);
		final Integer selectionCount = countUsedFields(selections);
		final Integer usedFieldCount = Math.min(
			availableFieldCount,
			selectionCount + 1
		);

		final Map<Integer, List<DependentPicklistValue>> fieldNumberToValues = new Map<Integer, List<DependentPicklistValue>>();

		//Early exit if only one field
		if (usedFieldCount == 0) {
			return fieldNumberToValues.values();
		}

		//Build the query parts
		final List<String> fieldNames = new List<String>{
			'Action_Type__c',
			'Action_Label__c',
			'Action_Body__c'
		};
		final List<String> clauses = new List<String>{
			'Type__c = :type'
		};
		final Integer usedFieldCountPlusOne = Math.min(
			availableFieldCount,
			usedFieldCount + 1
		);
		for (Integer i = 0; i < usedFieldCountPlusOne; i++) {
			final String fieldName = buildFieldName(i + 1);
			fieldNames.add(fieldName);
			if (i < usedFieldCount) {
				fieldNames.add(buildFieldDescriptionName(i + 1));
				final String selectedValue = i < selectionCount
					? selections[i]
					: null;
				if (String.isNotBlank(selectedValue)) {
					clauses.add(fieldName + ' = \'' + String.escapeSingleQuotes(selectedValue) + '\'');
				}
			}
		}

		//Query each matching dependent picklist set record:
		DependentPicklistValue wrapper;
		Map<String, DependentPicklistValue> valueToWrapper;
		final Map<Integer, Map<String, DependentPicklistValue>> fieldNumberToValueToWrapper = new Map<Integer, Map<String, DependentPicklistValue>>();
		for (Dependent_Picklist_Set__c picklistSet : Database.query(
			'SELECT ' + String.join(fieldNames, ', ') + ' '
				+ 'FROM Dependent_Picklist_Set__c '
				+ 'WHERE ' + String.join(clauses, ' AND ')
		)) {
			//For each result, build options from the available fields:
			for (Integer i = 0; i < usedFieldCount; i++) {
				//Get the field number, name, and value.  Move on if the
				//field is blank.
				final Integer fieldNumber = i + 1;
				final String fieldName = buildFieldName(fieldNumber);
				final String value = (String) picklistSet.get(fieldName);
				if (String.isBlank(value)) {
					break;
				}

				//Get a map of all Field_x__c values so far
				valueToWrapper = fieldNumberToValueToWrapper.get(fieldNumber);
				if (valueToWrapper == null) {
					valueToWrapper = new Map<String, DependentPicklistValue>();
					fieldNumberToValueToWrapper.put(fieldNumber, valueToWrapper);
				}

				//Add the field to the output
				wrapper = valueToWrapper.get(value);
				if (wrapper == null) {
					wrapper = new DependentPicklistValue(
						picklistSet,
						fieldNumber
					);
					valueToWrapper.put(value, wrapper);
				}
			}
		}

		//Prepare the results
		for (Integer fieldNumber : fieldNumberToValueToWrapper.keySet()) {
			fieldNumberToValues.put(
				fieldNumber,
				fieldNumberToValueToWrapper.get(fieldNumber).values()
			);
		}

		//Move the results from an integer indexed map (1..n) to a
		//standard array.
		Integer counter = 1;
		final List<List<DependentPicklistValue>> output = new List<List<DependentPicklistValue>>();
		while (fieldNumberToValues.containsKey(counter)) {
			output.add(fieldNumberToValues.get(counter));
			counter++;
		}
		return output;
	}

	public static List<List<DependentPicklistValue>> collateMultiSelectFieldOptions(String type, List<List<String>> selections) {
//		System.debug('DEBUG >> calling collateMultiSelectFieldOptions. Type: ' + type + 'Selections : ' + selections);
		final List<List<DependentPicklistValue>> output = new List<List<DependentPicklistValue>>();

		if (selections == null){
			return output;
		}

		//Get the number of fields that need to be considered.
		final Integer availableFieldCount = countGenericFieldsUsedByType(type);
		final Integer selectionCount = countUsedMultiSelectFields(selections);
		final Integer usedFieldCount = Math.min(
			availableFieldCount,
			selectionCount + 1
		);

		final Map<Integer, List<DependentPicklistValue>> fieldNumberToValueList = new Map<Integer, List<DependentPicklistValue>>();

		//Early exit if only one field
		if (usedFieldCount == 0) {
			return fieldNumberToValueList.values();
		}

		//Build the query parts
		final List<String> fieldNames = new List<String>{
			'Action_Type__c',
			'Action_Label__c',
			'Action_Body__c'
		};
		final List<String> clauses = new List<String>{
			'Type__c = :type'
		};
		final Integer usedFieldCountPlusOne = Math.min(
			availableFieldCount,
			usedFieldCount + 1
		);

		Map<String, Object> bindings = new Map<String, Object> {
			'type' => type
		};
		for (Integer i = 0; i < usedFieldCountPlusOne; i++) {
			final String fieldName = buildFieldName(i + 1);
			fieldNames.add(fieldName);
			if (i < usedFieldCount) {
				fieldNames.add(buildFieldDescriptionName(i + 1));
				if(i < selectionCount) {
					String bindingName = 'field' + i;
					bindings.put(bindingName, selections[i]);
					clauses.add(fieldName + ' IN :' + bindingName);
				}
			}
		}

		//Query each matching dependent picklist set record:
		List<DependentPicklistValue> wrappers;
		final String query = 'SELECT ' + String.join(fieldNames, ', ') + ' '
			+ 'FROM Dependent_Picklist_Set__c '
			+ 'WHERE ' + String.join(clauses, ' AND ');


//		System.debug('DEBUG >> querying Dependent_Picklist_Set__c: ' + query);

		List<Dependent_Picklist_Set__c> results = Database.queryWithBinds(
			query,
			bindings,
			AccessLevel.SYSTEM_MODE
		);
		for (Dependent_Picklist_Set__c picklistSet : results) {

			//For each result, build options from the available fields:
			for (Integer i = 0; i < usedFieldCount; i++) {
				//Get the field number, name, and value.  Move on if the
				//field is blank.
				final Integer fieldNumber = i + 1;
				final String fieldName = buildFieldName(fieldNumber);
				final String value = (String) picklistSet.get(fieldName);
				if (String.isBlank(value)) {
					break;
				}
//				System.debug('DEBUG >> picklistSet ' + fieldName + ':' + value);

				//Add the field to the output
				wrappers = fieldNumberToValueList.get(fieldNumber);
				if (wrappers == null) {
					wrappers = new List<DependentPicklistValue> {
						new DependentPicklistValue(
							picklistSet,
							fieldNumber
						)
					};
					fieldNumberToValueList.put(fieldNumber, wrappers);
				} else {
					wrappers.add(new DependentPicklistValue(
						picklistSet,
						fieldNumber
					));
				}
			}
		}

		//Move the results from an integer indexed map (1..n) to a
		//standard array.
		Integer counter = 1;

		while (fieldNumberToValueList.containsKey(counter)) {
			output.add(fieldNumberToValueList.get(counter));
			counter++;
		}
//		System.debug('DEBUG >> collateMultiSelectFieldOptions count: ' + output.size());
		return output;
	}
}