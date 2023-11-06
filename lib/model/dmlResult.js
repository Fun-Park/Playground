// noinspection JSUnresolvedVariable
module.exports = class DmlResult {

    /**
     * All returned records.
     *
     * @type {RecordResult[]}
     * @private
     */
    __records = [];

    /**
     * All returned records that are without errors.
     *
     * @type {RecordResult[]}
     * @private
     */
    __successRecords = [];

    /**
     * All returned records that have errors.
     *
     * @type {RecordResult[]}
     * @private
     */
    __errorRecords = [];

    /**
     * All returned records that are without errors.
     *
     * @type {string[]}
     * @private
     */
    __errors = []

    /**
     * Have any errors occurred.
     *
     * @type {boolean}
     * @private
     */
    __hasErrors = false;

    /**
     * Constructs a new instance.
     *
     * @param {RecordResult|RecordResult[]} recordResult
     */
    constructor(recordResult) {
        if(Array.isArray(recordResult) === true) {
            for (let i = 0, j = recordResult.length; i < j; i++) {
                this.__processRecordResult(recordResult[i]);
            }
        } else {
            // noinspection JSCheckFunctionSignatures
            this.__processRecordResult(recordResult);
        }
    }

    /**
     * Adds a single result to the instance.
     *
     * @param {RecordResult} recordResult
     * @private
     */
    __processRecordResult(recordResult) {
        this.__records.push(recordResult);
        if(recordResult.success === true) {
            this.__successRecords.push(recordResult);
        } else {
            this.__errorRecords.push(recordResult);
            // noinspection JSCheckFunctionSignatures
            this.__errors.push(...recordResult.errors);
            this.__hasErrors = true;
        }
    }

    /**
     * Get all record results.
     *
     * @returns {RecordResult[]}
     */
    getResults() {
        return this.__records;
    }

    /**
     * Get all records that were processed without
     * error.
     *
     * @returns {RecordResult[]}
     */
    getSuccessResult() {
        return this.__successRecords;
    }

    /**
     * Get all records that were processed with
     * errors.
     *
     * @returns {RecordResult[]}
     */
    getErrorResult() {
        return this.__records;
    }

    /**
     * Returns all error messages.
     *
     * @returns {string[]}
     */
    getErrors() {
        return this.__errors;
    }

    /**
     * Returns whether any errors have occurred.
     *
     * @returns {boolean}
     */
    get hasErrors() {
        return this.__hasErrors;
    }
}