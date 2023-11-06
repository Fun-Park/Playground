public without sharing class DependentPicklistSetViewController {

	@AuraEnabled(Cacheable=true)
	public static List<List<DependentPicklistSetUtil.DependentPicklistValue>> getAvailableValues(String dependentPicklistType, String selectionsJson) {
		final List<String> selections = (List<String>) JSON.deserialize(selectionsJson, List<String>.class);
		return DependentPicklistSetUtil.collateFieldOptions(dependentPicklistType, selections);
	}

	@AuraEnabled(Cacheable=true)
	public static List<List<DependentPicklistSetUtil.DependentPicklistValue>> getAvailableMultiSelectValues(String dependentPicklistType, String selectionsJson) {
		final List<List<String>> selections = (List<List<String>>) JSON.deserialize(selectionsJson, List<List<String>>.class);
//		System.debug('DEBUG >> getAvailableMultiSelectValues()');
		return DependentPicklistSetUtil.collateMultiSelectFieldOptions(dependentPicklistType, selections);
	}

	@AuraEnabled(Cacheable=true)
	public static List<DependentPicklistSetUtil.DependentPicklistDefinition> getMetadata(String dependentPicklistType) {
		return DependentPicklistSetUtil.getPicklistDefinitionsForType(dependentPicklistType);
	}

}