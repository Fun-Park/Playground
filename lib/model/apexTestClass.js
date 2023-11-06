const ApexBase = require("./apexBase");
const {cleanJson} = require("./modelUtil");

// noinspection JSUnresolvedVariable
module.exports = class ApexTestClass extends ApexBase {

    /**
     * An array of all test failures recorded against
     * this test class.
     *
     * @type {TestFailure[]}
     * @private
     */
    __failures = [];

    /**
     * Does this test class use the `@seeAllData`
     * annotation?
     *
     * @private
     */
    __seeAllData;

    /**
     * Constructs a new instance.
     *
     * @param {Record} queriedApexClass
     */
    constructor(queriedApexClass) {
        super(queriedApexClass);
        this.__seeAllData = queriedApexClass.Body.toLowerCase().indexOf("seealldata") !== -1;
    }

    /**
     * Overrides the default toJSON method.
     *
     * @returns {Object}
     */
    toJSON() {
        return cleanJson(
            this,
            {
                "__seeAllData" : "seeAllData",
                "__failures" : "failures"
            },
            super.toHandleBars()
        );
    }

    /**
     * Returns a handlebars-friendly version of
     * this instance.
     *
     * @returns {Object}
     */
    toHandleBars() {
        const handlebarsFailures = [];
        for(let i = 0, j = this.__failures.length; i < j; i++) {
            handlebarsFailures.push(
                this.__failures[i].toHandleBars()
            );
        }

        return Object.assign(
            {},
            super.toHandleBars(),
            {
                seeAllData : this.seeAllData,
                failures : handlebarsFailures
            }
        );
    }

    /**
     * Returns whether this test class uses the
     * `@seeAllData` annotation.
     *
     * @returns {boolean}
     */
    get seeAllData() {
        return this.__seeAllData === true;
    }

    /**
     * Stores a test failure against this instance.
     *
     * @param {TestFailure} apexFailure
     */
    addFailure(apexFailure) {
        this.__failures.push(apexFailure);
    }

    /**
     * Returns whether any failures have been recorded
     * against this Apex Test Class.
     *
     * @returns {boolean}
     */
    get hasFailures() {
        return this.__failures.length !== 0;
    }

    /**
     * Returns all test failure records associated with
     * this Apex Test Class.
     *
     * @returns {TestFailure[]}
     */
    get failures() {
        return [...this.__failures];
    }

};