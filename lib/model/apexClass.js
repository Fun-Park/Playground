const ApexBase = require("./apexBase");
const {cleanJson} = require("./modelUtil");

const {calculateCoverage} = require("./../util");

// noinspection JSUnresolvedVariable
module.exports = class ApexClass extends ApexBase {

    /**
     * The number of lines with code coverage.  This will
     * always be zero prior to initialization using the
     * `setCoverage` function.
     *
     * @type {number}
     * @private
     */
    __linesCovered = 0;

    /**
     * The number of lines without code coverage.  This will
     * always be zero prior to initialization using the
     * `setCoverage` function.
     *
     * @type {number}
     * @private
     */
    __linesUncovered = 0;

    /**
     * The percentage of lines with code coverage.  This will
     * always be zero prior to initialization using the
     * `setCoverage` function.
     *
     * @type {number}
     * @private
     */
    __coverage = 0;

    /**
     * Constructs a new instance.
     *
     * @param {Record} queriedApexClass
     */
    constructor(queriedApexClass) {
        super(queriedApexClass);
    }

    /**
     * Overrides the default toJSON method.
     *
     * @returns {Object}
     */
    toJSON() {
        return this.toHandleBars();
    }

    /**
     * Returns a handlebars-friendly version of
     * this instance.
     *
     * @returns {Object}
     */
    toHandleBars() {
        return cleanJson(
            this,
            {
                "__linesCovered" : "linesCovered",
                "__linesUncovered" : "linesUncovered",
                "__coverage" : "coverage"
            },
            super.toHandleBars()
        );
    }

    /**
     * Sets the coverage level for this class.
     *
     * @param {Record} apexCodeCoverageAggregate
     */
    setCoverage(apexCodeCoverageAggregate) {
        if(apexCodeCoverageAggregate.ApexClassOrTriggerId !== this.id) {
            throw new TypeError(
                `Attempted to add coverage for ${apexCodeCoverageAggregate.ApexClassOrTrigger.Name} (${apexCodeCoverageAggregate.ApexClassOrTriggerId}) to ${this.name} (${this.id}).`
            );
        }
        this.__linesCovered = apexCodeCoverageAggregate.NumLinesCovered || 0;
        this.__linesUncovered = apexCodeCoverageAggregate.NumLinesUncovered || 0;
        this.__coverage = calculateCoverage(
            this.__linesCovered,
            this.__linesUncovered
        );
    }

    /**
     * Gets the number of lines with code coverage.
     * This will always be zero prior to initialization
     * using the `setCoverage` function.
     *
     * @returns {number}
     */
    get linesCovered() {
        return this.__linesCovered;
    }

    /**
     * Gets the number of lines without code coverage.
     * This will always be zero prior to initialization
     * using the `setCoverage` function.
     *
     * @type {number}
     */
    get linesUncovered() {
        return this.__linesUncovered;
    }

    /**
     * Gets the percentage of lines with code coverage.
     * This will always be zero prior to initialization
     * using the `setCoverage` function.
     *
     * @type {number}
     */
    get coverage() {
        return this.__coverage;
    }

};