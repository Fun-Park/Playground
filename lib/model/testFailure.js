const {cleanJson} = require("./modelUtil");

const OUTCOME_PASS = "Pass";

// noinspection JSUnresolvedVariable
module.exports = class TestFailure {

	__message;
	__methodName;
	__outcome;
	__stackTrace;

	/**
	 * Constructs a new instance.  Requires an
	 * ApexTestResult record whose outcome is not
	 * equal to "Pass".
	 *
	 * @param {Record} apexTestResult
	 */
	constructor(apexTestResult) {
		if(apexTestResult.Outcome === OUTCOME_PASS) throw new TypeError(
			`Attempted to create a TestFailure instance from a passing test.`
		);
		this.__message = apexTestResult.Message;
		this.__methodName = apexTestResult.MethodName;
		this.__outcome = apexTestResult.Outcome;
		this.__stackTrace = apexTestResult.StackTrace;
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
				"__message" : "message",
				"__methodName" : "methodName",
				"__outcome" : "outcome",
				"__stackTrace" : "stackTrace"
			}
		);
	}

	get message() {
		return this.__message;
	}

	get methodName() {
		return this.__methodName;
	}

	get outcome() {
		return this.__outcome;
	}

	get stackTrace() {
		return this.__stackTrace;
	}

}