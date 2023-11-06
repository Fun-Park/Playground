/**
 * @module DependentPicklists
 */

import {LightningElement} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import {NavigationMixin} from "lightning/navigation";

import {parseError} from "c/errorParser";

import {stripHtml} from "c/utilityMethods";


import server_getRecords from "@salesforce/apex/DependentPicklistSetListViewController.getRecordsForListView";
import server_getMetadata from "@salesforce/apex/DependentPicklistSetListViewController.getListViewMetadata";

const ROW_ACTION__VIEW_RECORD = "view";

const COLUMN__ROW_ACTIONS = {
    type: "action",
    typeAttributes: {
        rowActions: [
            {
                label: "View Record",
                name: ROW_ACTION__VIEW_RECORD,
                iconName: "utility:new_window"
            }
        ]
    }
};

const COLUMN_ACTION__BULK_UPDATE_FIELD = "field_bulk_update";

const COLUMN_ACTION__BULK_UPDATE_ACTION = "action_bulk_update";

const COLUMN_ACTIONS__FIELD = [
    {
        label: "Bulk field update",
        name: COLUMN_ACTION__BULK_UPDATE_FIELD,
        iconName: "utility:list"
    }
];

const COLUMN_ACTIONS__ACTION = [
    {
        label: "Bulk action update",
        name: COLUMN_ACTION__BULK_UPDATE_ACTION,
        iconName: "utility:list"
    }
];

const DEFAULT_OPTION__QUERY_LIMIT = "50";
const OPTIONS__QUERY_LIMIT = [
    {
        label: "50 Records",
        value: "50"
    },
    {
        label: "100 Records",
        value: "100"
    },
    {
        label: "150 Records",
        value: "150"
    },
    {
        label: "200 Records",
        value: "200"
    },
    {
        label: "250 Records",
        value: "250"
    }
];

const COLUMNS__ACTION = [
    {
        type: "text",
        fieldName: "Action_Type__c",
        label: "Action Type",
        actions: COLUMN_ACTIONS__ACTION
    },
    {
        type: "text",
        fieldName: "Action_Label__c",
        label: "Action Label",
        actions: COLUMN_ACTIONS__ACTION
    },
    {
        type: "text",
        fieldName: "Action_Body__c",
        label: "Action Body",
        actions: COLUMN_ACTIONS__ACTION
    }
];

const buildColumns = (fieldsUsed, fieldOverrideMap, hasRecordViewAccess) => {
    const columns = [];
    for (let i = 1; i <= fieldsUsed; i++) {
        const fieldName = `Field_${i}__c`;
        const overrideValue = fieldOverrideMap[fieldName];
        columns.push({
            type: "text",
            fieldName,
            fieldNumber: i,
            label: !overrideValue
                ? `Field ${i}`
                : overrideValue.label,
            actions: COLUMN_ACTIONS__FIELD
        });
    }
    columns.push(...COLUMNS__ACTION);
    if (hasRecordViewAccess === true) {
        columns.push(COLUMN__ROW_ACTIONS)
    }
    return columns;
};

/**
 * @param {string} fieldName
 * @param {string} fieldLabel
 * @param {string} availableValues
 * @param {boolean?} stripHTML
 * @returns {ViewFilter}
 */
const fieldToFilter = (fieldName, fieldLabel, availableValues, stripHTML) => {
    const availableValueCount = availableValues.length;
    const availableOptions = [];
    const allValues = [];
    let hasBlankValue = false;
    for (let value, label, x = 0; x < availableValueCount; x++) {
        value = availableValues[x];
        //Blanks here will always be an empty string
        if (value === "") {
            label = "[Blank value]";
            hasBlankValue = true;
        } else if (stripHTML === true) {
            label = stripHtml(value);
        } else {
            label = value;
        }

        availableOptions.push({
            label,
            value
        });
        allValues.push(value);
    }
    return {
        availableOptions,
        fieldName,
        label: fieldLabel,
        allowedValues: [...allValues],
        allValues,
        availableValueCount: availableOptions.length,
        hasBlankValue
    };
}

/**
 *
 * @param {ViewFilter[]} oldFilters
 * @param {ViewFilter[]} newFilters
 * @returns {ViewFilter[]}
 * @private
 */
const mergeFilters = (oldFilters, newFilters) => {
    const fieldToOldFilter = new Map();
    for(let i = 0, j = oldFilters.length; i < j; i++) {
        const oldFilter = oldFilters[i];
        fieldToOldFilter.set(oldFilter.fieldName, oldFilter);
    }

    const mergedFilters = [];
    for(let i = 0, j = newFilters.length; i < j; i++) {
        const newFilter = newFilters[i];
        mergedFilters.push(mergeFilter(
            fieldToOldFilter.get(newFilter.fieldName),
            newFilter
        ));
    }
    return mergedFilters;
}

/**
 * @param {ViewFilter|undefined} oldFilter
 * @param {ViewFilter} newFilter
 * @returns {ViewFilter}
 * @private
 */
const mergeFilter = (oldFilter, newFilter) => {
    if(oldFilter === undefined) {
        return newFilter;
    }
    const allowedValues = oldFilter.allowedValues.length === oldFilter.allValues.length
        ? newFilter.allValues
        : oldFilter.allowedValues.filter(value => newFilter.allValues.includes(value));
    return {
        availableOptions: newFilter.availableOptions,
        fieldName : newFilter.fieldName,
        label : newFilter.label,
        allValues : newFilter.allValues,
        availableValueCount : newFilter.availableValueCount,
        hasBlankValue: newFilter.hasBlankValue,
        allowedValues: allowedValues.length === 0
            ? newFilter.allValues
            : allowedValues
    };
}

/**
 * @typedef FieldOverride
 *
 * @property {string} field
 *                The field's API name
 * @property {string} label
 *                The label to displayed
 */

/**
 * @typedef AggregateActionsResult
 *
 * @property {string} actionTypes
 * @property {string} actionLabels
 * @property {string} actionBodies
 */

/**
 * @typedef GetListViewMetadataResult
 *
 * @property {string} type
 * @property {Object<string, FieldOverride>} fieldOverrideMap
 *        Each field's API name mapped to a FieldOverride instance.
 * @property {string[][]} fieldsAndAvailableValues
 *        An array of sequential (i.e. 1..n) field's aggregated values.
 * @property {AggregateActionsResult} aggregatedActions
 * @property {boolean} hasRecordViewAccess
 */

/**
 * @typedef ViewFilter
 *
 * @property {ComboboxItem[]} availableOptions
 *      Currently used values for autocompletion
 * @property {string} fieldName
 * @property {string} label
 * @property {string[]} allValues
 * @property {string[]} allowedValues
 * @property {number} availableValueCount
 * @property {boolean} hasBlankValue
 *      May a blank value be selected?
 */

export default class DependentPicklistSetListView extends NavigationMixin(LightningElement) {

    type;

    availableTypes;

    records;

    totalResults = 0;

    columns;

    selectedLimit = DEFAULT_OPTION__QUERY_LIMIT;

    hasInit = false;

    loadingRecords = true;
    loadingMetadata = true;
    loadingAction = false;
    hasRecordViewAccess = false;

    /**
     * @type {Object<string, FieldOverride>}
     */
    fieldOverrideMap = {};

    /**
     * @type {ViewFilter[]}
     */
    filters;

    returnedRecordCount;

    constructor() {
        try {
            super();
            this.getMetadataAndRecords(false);
        } catch (ex) {
            this.__handleError(ex);
        }
    }

    get loading() {
        return this.loadingRecords === true || this.loadingMetadata === true || this.loadingAction === true;
    }

    get optionsLimits() {
        return OPTIONS__QUERY_LIMIT;
    }

    get hasMore() {
        return !!this.records && this.totalResults > this.records.length;
    }

    errorCallback(error, stack) {
        this.__handleError(error, stack);
    }

    getMetadataAndRecords(maintainFilters) {
        try {
            this.loadingMetadata = true;
            server_getMetadata({
                type: this.type
            }).then(data => {
                this.fieldOverrideMap = data.fieldOverrideMap;
                this.type = data.type;
                const filters = [];
                for (let i = 0, j = data.fieldsAndAvailableValues.length; i < j; i++) {
                    const availableValues = data.fieldsAndAvailableValues[i];
                    const fieldName = `Field_${i + 1}__c`;
                    const fieldOverride = this.fieldOverrideMap[fieldName];
                    filters.push(fieldToFilter(
                        fieldName,
                        !fieldOverride
                            ? `Field ${i + 1}`
                            : fieldOverride.label,
                        availableValues
                    ));
                }
                const aggregatedActions = data.aggregatedActions;
                filters.push(fieldToFilter(
                    'Action_Type__c',
                    'Action Type',
                    aggregatedActions.actionTypes
                ));
                filters.push(fieldToFilter(
                    'Action_Label__c',
                    'Action Label',
                    aggregatedActions.actionLabels
                ));
                filters.push(fieldToFilter(
                    'Action_Body__c',
                    'Action Body',
                    aggregatedActions.actionBodies,
                    true
                ));
                this.filters = maintainFilters === true
                    ? mergeFilters(this.filters, filters)
                    : filters;
                this.hasInit = true;
                this.hasRecordViewAccess = data.hasRecordViewAccess;
                this.loadingMetadata = false;
                this.getRecordsFromServer();
            }).catch(ex => {
                this.__handleError(ex);
            }).finally(() => {
                this.loadingMetadata = false;
            })
        } catch (ex) {
            this.__handleError(ex);
            this.loadingMetadata = false;
        }
    }

    getRecordsFromServer() {
        const type = this.type,
            filters = this.filters,
            recordLimit = this.selectedLimit;
        if (!type || !filters || !recordLimit) {
            return this.loadingRecords = false;
        }
        this.loadingRecords = true;
        server_getRecords({
            type,
            filters,
            recordLimit
        }).then(data => {
            this.availableTypes = data.types;
            this.type = data.type;
            this.returnedRecordCount = data.records.length;
            this.records = [...data.records];
            this.totalResults = data.totalResults;
            this.columns = buildColumns(
                data.fieldsUsed,
                this.fieldOverrideMap,
                this.hasRecordViewAccess
            );
            this.loadingRecords = false;
        }).catch(ex => {
            this.__handleError(ex);
        }).finally(() => {
            this.loadingRecords = false;
        });
    }

    handleTypeChange(ev) {
        ev.stopPropagation();
        this.loadingRecords = true;
        this.loadingMetadata = true;
        this.type = ev.target.value;
        this.getMetadataAndRecords(false);
    }

    handleFilterButtonClick(ev) {
        try {
            ev.stopPropagation();
            this.template.querySelector("[data-id=\"filterModal\"]").show();
        } catch (ex) {
            this.__handleError(ex);
        }
    }

    handleClearFilters(ev) {
        try {
            ev.stopPropagation();
            this.filters = ev.target.filters;
            console.log({hasChanged: ev.detail.hasChanged})
            if (ev.detail.hasChanged === true) {
                this.getRecordsFromServer();
            }
        } catch (ex) {
            this.__handleError(ex);
        }
    }

    handleSaveFilters(ev) {
        try {
            ev.stopPropagation();
            this.filters = ev.target.filters;
            console.log({hasChanged: ev.detail.hasChanged})
            if (ev.detail.hasChanged === true) {
                this.loadingRecords = true;
                this.getRecordsFromServer();
            }
        } catch (ex) {
            this.__handleError(ex)
            this.loadingRecords = false;
        }
    }

    handleRowActions(ev) {
        try {
            ev.stopPropagation();
            const action = ev.detail.action.name;
            const row = ev.detail.row;

            if (action === ROW_ACTION__VIEW_RECORD) {
                this.__openRecordInNewTab(row.Id);
            }


        } catch (ex) {
            this.__handleError(ex);
        }
    }

    __openRecordInNewTab(recordId) {
        try {
            this.loadingAction = true;
            this[NavigationMixin.GenerateUrl]({
                type: "standard__recordPage",
                attributes: {
                    recordId: recordId,
                    actionName: "view"
                }
            }).then(url => {
                window.open(url, "_blank");
            }).catch(ex => {
                this.__handleError(ex);
            }).finally(() => {
                this.loadingAction = false;
            });
        } catch (ex) {
            this.__handleError(ex);
            this.loadingAction = false;
        }
    }

    handleHeaderActions(ev) {
        try {
            ev.stopPropagation();
            const columnDefinition = ev.detail.columnDefinition;
            const actionName = ev.detail.action.name;
            switch (actionName) {
                case COLUMN_ACTION__BULK_UPDATE_FIELD:
                    this.__prepareBulkFieldUpdateModal(
                        columnDefinition.fieldNumber
                    );
                    break;

                case COLUMN_ACTION__BULK_UPDATE_ACTION:
                    this.__prepareBulkActionUpdateModal();
                    break;
            }

        } catch (ex) {
            this.__handleError(ex);
        }
    }

    /**
     * @returns {undefined|object[]}
     * @private
     */
    __getSelectedRecordsOrWarnUser() {
        //Get the selected rows
        const selectedRecords = this.template.querySelector("[data-id=listView]").getSelectedRows();
        const selectedRecordCount = selectedRecords.length;

        //Early exit if nothing is selected
        if (selectedRecordCount === 0) {
            this.dispatchEvent(new ShowToastEvent({
                title: "No records selected",
                message: "Select the records you want to bulk update",
                variant: "info"
            }));
            return undefined;
        }
        return selectedRecords;
    }

    __prepareBulkActionUpdateModal() {
        try {
            const selectedRecords = this.__getSelectedRecordsOrWarnUser();
            if (selectedRecords === undefined) {
                return;
            }
            this.loadingAction = true;
            this.template.querySelector("[data-id=bulkUpdateModal]").showActionUpdate(
                this.type,
                selectedRecords,
                this.hasMore,
                this.selectedLimit
            ).catch(ex => {
                this.__handleError(ex);
            }).finally(() => {
                this.loadingAction = false;
            });
        } catch (ex) {
            this.__handleError(ex);
            this.loadingAction = false;
        }
    }

    __prepareBulkFieldUpdateModal(fieldNumber) {
        try {
            const selectedRecords = this.__getSelectedRecordsOrWarnUser();
            if (selectedRecords === undefined) {
                return;
            }
            this.loadingAction = true;
            this.template.querySelector("[data-id=bulkUpdateModal]").showFieldUpdate(
                this.type,
                fieldNumber,
                selectedRecords,
                this.hasMore,
                this.selectedLimit
            ).catch(ex => {
                this.__handleError(ex);
            }).finally(() => {
                this.loadingAction = false;
            });

        } catch (ex) {
            this.__handleError(ex);
            this.loadingAction = false;
        }
    }

    handleBulkUpdateSave(ev) {
        try {
            ev.stopPropagation();
            this.loadingAction = false;
            this.getMetadataAndRecords(true);
        } catch (ex) {
            this.__handleError(ex);
        }
    }

    showLoader() {
        this.loadingAction = true;
    }

    hideLoader() {
        this.loadingAction = false;
    }

    handleLimitChange(ev) {
        try {
            this.loadingRecords = true;
            this.selectedLimit = ev.target.value;
            this.getRecordsFromServer();
        } catch (ex) {
            this.__handleError(ex);
        }
    }

    __handleError(ex, stack) {
        this.dispatchEvent(parseError(ex, stack).logToConsole().getToastEvent());
    }

}