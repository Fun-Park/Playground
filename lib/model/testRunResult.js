const {cleanJson} = require("./modelUtil");
const {parseSalesforceDate} = require("./../util");

const APEX_TEST_RUN_RESULT_STATUS_ABORTED = "Aborted";
const APEX_TEST_RUN_RESULT_STATUS_COMPLETED = "Completed";
const APEX_TEST_RUN_RESULT_STATUS_FAILED = "Failed";

// noinspection JSUnresolvedVariable
/**
 * Simple wrapper class for the ApexTestRunResult
 * SObject.
 */
module.exports = class ApexTestRunResult {

    /**
     * The total number of classes executed
     * during the test run.
     *
     * @type {number}
     * @private
     */
    __classesCompleted;

    /**
     * The total number of classes enqueued
     * during the test run.
     *
     * @type {number}
     * @private
     */
    __classesEnqueued;

    /**
     * The total number of methods completed
     * during the test run.
     *
     * @type {number}
     * @private
     */
    __methodsCompleted;

    /**
     * The total number of methods enqueued
     * for the test run.
     *
     * @type {number}
     * @private
     */
    __methodsEnqueued;

    /**
     * The total number of methods that failed
     * during this test run.
     *
     * @type {number}
     * @private
     */
    __methodsFailed;

    /**
     * The time at which the test run started.
     *
     * @type {Date}
     * @private
     */
    __startTime;

    /**
     * The time at which the test run ended.
     *
     * @type {Date}
     * @private
     */
    __endTime;

    /**
     * The number of seconds that elapsed during
     * the test run.
     *
     * @type {number}
     * @private
     */
    __testTime;

    /**
     * The status of the test run.  Values include:
     * <ul>
     *     <li>Queued</li>
     *     <li>Processing</li>
     *     <li>Aborted</li>
     *     <li>Completed</li>
     *     <li>Failed</li>
     * </ul>
     *
     * @type {string}
     * @private
     */
    __status;

    /**
     * Has the job been aborted?
     *
     * @type {boolean}
     * @private
     */
    __isAborted;

    /**
     * Has the job succeeded?
     *
     * @type {boolean}
     * @private
     */
    __isSuccess;

    /**
     * Has the job failed (i.e. completed with
     * errors)?
     *
     * @type {boolean}
     * @private
     */
    __hasFailed;

    /**
     * Has the job finished (i.e. all tests have
     * run)?
     *
     * @type {boolean}
     * @private
     */
    __hasFinished;

    /**
     * Constructs a new instance.
     *
     * @param {Record} apexTestRunResultRecord
     */
    constructor(apexTestRunResultRecord) {
        // noinspection JSValidateTypes
        this.__classesCompleted = apexTestRunResultRecord.ClassesCompleted || 0;
        // noinspection JSValidateTypes
        this.__classesEnqueued = apexTestRunResultRecord.ClassesEnqueued || 0;
        // noinspection JSValidateTypes
        this.__methodsCompleted = apexTestRunResultRecord.MethodsCompleted || 0;
        // noinspection JSValidateTypes
        this.__methodsEnqueued = apexTestRunResultRecord.MethodsEnqueued || 0;
        // noinspection JSValidateTypes
        this.__methodsFailed = apexTestRunResultRecord.MethodsFailed || 0;
        // noinspection JSValidateTypes
        this.__startTime = parseSalesforceDate(
            apexTestRunResultRecord.StartTime
        );
        // noinspection JSValidateTypes
        this.__endTime = parseSalesforceDate(
            apexTestRunResultRecord.EndTime
        );
        // noinspection JSValidateTypes
        this.__testTime = apexTestRunResultRecord.TestTime;
        // noinspection JSValidateTypes
        this.__status = apexTestRunResultRecord.Status;

        this.__isAborted = this.__status === APEX_TEST_RUN_RESULT_STATUS_ABORTED;
        this.__isSuccess = this.__status === APEX_TEST_RUN_RESULT_STATUS_COMPLETED;
        this.__hasFailed = this.__status === APEX_TEST_RUN_RESULT_STATUS_FAILED;
        this.__hasFinished = this.__isAborted || this.__isSuccess || this.__hasFailed;
    }

    /**
     * Overrides the default toJSON method.
     *
     * @returns {null|{}}
     */
    toJSON() {
        return cleanJson(
            this,
            {
                "__classesCompleted" : "classesCompleted",
                "__classesEnqueued" : "classesEnqueued",
                "__methodsCompleted" : "methodsCompleted",
                "__methodsEnqueued" : "methodsEnqueued",
                "__methodsPending" : "methodsPending",
                "__methodsFailed" : "methodsFailed",
                "__startTime" : "startTime",
                "__endTime" : "endTime",
                "__testTime" : "testTime",
                "__status" : "status",
                "__isAborted" : "isAborted",
                "__isSuccess" : "isSuccess",
                "__hasFailed" : "hasFailed",
                "__hasFinished" : "hasFinished"
            }
        );
    }

    /**
     * The total number of classes executed
     * during the test run.
     *
     * @type {number}
     */
    get classesCompleted() {
        return this.__classesCompleted;
    }

    /**
     * The total number of classes enqueued
     * during the test run.
     *
     * @type {number}
     */
    get classesEnqueued() {
        return this.__classesEnqueued;
    }

    /**
     * The total number of methods completed
     * during the test run.
     *
     * @type {number}
     */
    get methodsCompleted() {
        return this.__methodsCompleted;
    }

    /**
     * The total number of methods enqueued
     * for the test run.
     *
     * @type {number}
     */
    get methodsEnqueued() {
        return this.__methodsEnqueued;
    }

    /**
     * The total number of methods still pending
     * completion within the test run.
     *
     * @type {number}
     */
    get methodsPending() {
        return this.__methodsEnqueued - this.__methodsCompleted;
    }

    /**
     * The total number of methods that failed
     * during this test run.
     *
     * @type {number}
     */
    get methodsFailed() {
        return this.__methodsFailed;
    }

    /**
     * The time at which the test run started.
     *
     * @type {Date}
     */
    get startTime() {
        return this.__startTime;
    }

    /**
     * The time at which the test run ended.
     *
     * @type {Date}
     */
    get endTime() {
        return this.__endTime;
    }

    /**
     * The number of seconds that elapsed during
     * the test run.
     *
     * @type {number}
     */
    get testTime() {
        return this.__testTime;
    }

    /**
     * The status of the test run.  Values include:
     * <ul>
     *     <li>Queued</li>
     *     <li>Processing</li>
     *     <li>Aborted</li>
     *     <li>Completed</li>
     *     <li>Failed</li>
     * </ul>
     *
     * @type {string}
     */
    get status() {
        return this.__status;
    }

    /**
     * Has the job been aborted?
     *
     * @type {boolean}
     */
    get isAborted() {
        return this.__isAborted;
    }

    /**
     * Has the job succeeded?
     *
     * @type {boolean}
     */
    get isSuccess() {
        return this.__isSuccess;
    }

    /**
     * Has the job failed (i.e. completed with
     * errors)?
     *
     * @type {boolean}
     */
    get hasFailed() {
        return this.__hasFailed;
    }

    /**
     * Has the job finished (i.e. all tests have
     * run)?
     *
     * @type {boolean}
     */
    get hasFinished() {
        return this.__hasFinished;
    }



}