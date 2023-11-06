const Force = require("./force");
const ApexClass = require("./model/apexClass");
const ApexTestClass = require("./model/apexTestClass");
const TestRunResult = require("./model/testRunResult");
const CsvReportBuilder = require("./io/testReport/csvCoverageReportBuilder");
const HtmlReportBuilder = require("./io/testReport/htmlTestReportBuilder");
const QueryFilter = require("./query/queryFilter");
const TestFailure = require("./model/testFailure");

const {
	calculateCoverage,
	capitalize,
	pluralize,
	pluralizeWithNumber,
	wait
} = require("./util");

/**
 * @typedef {object} ApexTestRunnerSettings
 *
 * @property {number} [maximumRunTimeInSeconds]
 * 						The maximum time the test
 * 						execution may run (in seconds).
 * 						If the execution exceeds this
 * 						limit, all running tests will
 * 						be aborted.  If this value is
 * 						null, no time limit will be
 * 						applied.
 * @property {string} [htmlReportPath]
 * 						The path to store the HTML
 * 						report.  If this value is
 * 						null, no HTML report will be
 * 						created.
 * @property {string} [csvReportPath]
 * 						The path to store the CSV
 * 						coverage report.  If this
 * 						value is null, no HTML
 * 						report will be created.
 * @property {boolean} [abortActiveTests]
 * 						Should all active tests be aborted
 * 						prior to execution.
 */

/**
 * @type {ApexTestRunnerSettings}
 */
const DEFAULT_SETTINGS = {
	maximumRunTimeInSeconds : undefined,
	htmlReportPath : "./report.html",
	csvReportPath : "./coverage.csv",
	abortActiveTests : true,
	testExecutionId : undefined
};


/**
 * Used to rule out non-test classes that contain
 * test methods.
 *
 * @type {number}
 */
const MINIMUM_API_VERSION = 27;

module.exports = class ApexInspector {

	__force;

	/**
	 * All inspected classes.
	 *
	 * @type {undefined|Map<string, ApexClass>}
	 * @private
	 */
	__idToClass;

	/**
	 * All inspected test classes.
	 *
	 * @type {undefined|Map<string, ApexTestClass>}
	 * @private
	 */
	__idToTestClass;

	/**
	 * Records whether the tests have been run and
	 * coverage data has been retrieved.
	 *
	 * @type {boolean}
	 * @private
	 */
	__testingComplete = false;

	/**
	 * Constructs a new instance.
	 *
	 * @param {Force} force
	 */
	constructor(force) {
		this.__force = force;
	}

	/**
	 * Generates the coverage report based on prior test results.
	 *
	 * Queries (Tooling API) all ApexClass and
	 * ApexTrigger records.  Inactive classes
	 * and triggers will be ignored.
	 *
	 * Reports on the test results.
	 *
	 * @param {ApexTestRunnerSettings} [params]
	 * @returns {Promise<void>}
	 */
	async generateCoverageReport(params) {
		return new Promise(async(resolve, reject) => {
			try {
				//Get the run settings
				const settings = !params
					? DEFAULT_SETTINGS
					: Object.assign({}, DEFAULT_SETTINGS, params);

				//Initialize the test runner maps
				this.__idToClass = new Map();
				this.__idToTestClass = new Map();

				//Find any apex classes (and test classes) that
				//require testing.
				await this.__inspectClasses(
					"ApexClass",
					"class",
					"classes"
				);

				//Find any apex triggers that require testing.
				await this.__inspectClasses(
					"ApexTrigger",
					"trigger",
					"triggers"
				);

				//Get the class/trigger level test coverage
				await this.__getTestCoverage();

				//Get class arrays
				const classes = Array.from(this.__idToClass.values());
				const testClasses = Array.from(this.__idToTestClass.values());

				//Create the HTML report
				if(!!settings.htmlReportPath) {
					console.log(
						`Writing HTML test report to ${settings.htmlReportPath}`
					);
					await HtmlReportBuilder.createReport(
						settings.htmlReportPath,
						classes,
						testClasses,
						"QBCC Required Coverage",
						85
					);
				}

				//Create the CSV report
				if(!!settings.csvReportPath) {
					console.log(
						`Writing CSV coverage report to ${settings.csvReportPath}`
					);
					await CsvReportBuilder.createReport(
						settings.csvReportPath,
						classes
					);
				}

				resolve();
			} catch (ex) {
				reject(ex);
			}
		});
	}

	/**
	 * Runs all local apex tests.
	 *
	 * Queries (Tooling API) all ApexClass and
	 * ApexTrigger records.  Inactive classes
	 * and triggers will be ignored.
	 *
	 * Begins a test execution and awaits completion.
	 * Reports on the test results.
	 *
	 * @param {ApexTestRunnerSettings} [params]
	 * @returns {Promise<void>}
	 */
	async runLocalTests(params) {
		return new Promise(async(resolve, reject) => {
			try {
				//Get the run settings
				const settings = !params
					? DEFAULT_SETTINGS
					: Object.assign({}, DEFAULT_SETTINGS, params);

				//Abort any tests in progress
				if(settings.abortActiveTests) {
					await this.__force.Tooling.abortAllTests();
				}

				//Initialize the test runner maps
				this.__idToClass = new Map();
				this.__idToTestClass = new Map();

				//Find any apex classes (and test classes) that
				//require testing.
				await this.__inspectClasses(
					"ApexClass",
					"class",
					"classes"
				);

				//Find any apex triggers that require testing.
				await this.__inspectClasses(
					"ApexTrigger",
					"trigger",
					"triggers"
				);

				//Initiate the test execution.
				const testExecutionId = await this.__force.Tooling.runTestsAsync(this.__idToTestClass);

				console.info(
					`Text execution scheduled with Job ID ${testExecutionId}.`
				);

				const startTimeStamp = new Date().getTime();

				//Wait for the tests to complete
				let hasCompleted = false;
				const hasTimeLimit = !!settings.maximumRunTimeInSeconds;
				while (hasCompleted === false) {

					const totalSecondsElapsed = (new Date().getTime() - startTimeStamp) / 1000;

					//Get the current test status
					const status = await this.__checkTestRunStatus(testExecutionId);

					//Exit the loop if complete
					if (status.hasFinished === true) {
						hasCompleted = true;
						console.info(
							`All ${pluralizeWithNumber(status.methodsEnqueued, "test method")} have completed`
						);
					}

					//Handle maximum run time
					else if (hasTimeLimit === true && totalSecondsElapsed >= settings.maximumRunTimeInSeconds) {
						console.warn(
							`${settings.maximumRunTimeInSeconds} second test time limit reached.`
						);
						console.log(
							"Attempting to abort remaining tests."
						);
						await this.__force.Tooling.abortAllTests();
						hasCompleted = true;
					}

					//Otherwise, wait for completion
					else {
						//Calculate how long to sleep.
						const recommendedSleepTime = (Math.ceil(status.methodsPending / 10) * 10)/2;

						//Consider the run time limit
						const actualSleepTime = hasTimeLimit === true
							? Math.min(
								recommendedSleepTime,
								settings.maximumRunTimeInSeconds - totalSecondsElapsed
							) : recommendedSleepTime;

						console.log(
							`${new Date().toLocaleString()}: STATUS: ${pluralizeWithNumber(status.methodsPending, "method")} still running and ${pluralizeWithNumber(status.methodsFailed, "error")}.  Sleeping for ${pluralizeWithNumber(actualSleepTime, "second")}.`
						);
						await wait((actualSleepTime) * 1000);
					}
				}
				console.log(`${new Date().toLocaleString()}: Tests Completed`);
				//Collect any failed tests
				await this.__getTestFailures(testExecutionId);

				//Get the class/trigger level test coverage
				await this.__getTestCoverage();

				//Get class arrays
				const classes = Array.from(this.__idToClass.values());
				const testClasses = Array.from(this.__idToTestClass.values());

				//Create the HTML report
				if(!!settings.htmlReportPath) {
					console.log(
						`Writing HTML test report to ${settings.htmlReportPath}`
					);
					await HtmlReportBuilder.createReport(
						settings.htmlReportPath,
						classes,
						testClasses,
						"QBCC Required Coverage",
						85
					);
				}

				//Create the CSV report
				if(!!settings.csvReportPath) {
					console.log(
						`Writing CSV coverage report to ${settings.csvReportPath}`
					);
					await CsvReportBuilder.createReport(
						settings.csvReportPath,
						classes
					);
				}

				resolve();
			} catch (ex) {
				reject(ex);
			}
		});
	}


	/**
	 * Queries (Tooling API) all records of a given
	 * type. Inactive records will be ignored.
	 *
	 * @param {("ApexClass"|"ApexTrigger")} sObjectName
	 * @param {("class"|"trigger")} singularName
	 * @param {("classes"|"triggers")} pluralName
	 * @param {boolean} [suppressWarnings=false]
	 * @returns {Promise<void>}
	 * @private
	 */
	async __inspectClasses(sObjectName, singularName, pluralName, suppressWarnings) {
		return new Promise(async (resolve, reject) => {
			try {

				const classPlural = function(number) {
					return pluralizeWithNumber(
						number,
						singularName,
						pluralName
					);
				}

				//Create some local variables to store all
				//queried classes and test classes.
				const invalidClasses = [];
				const seeAllDataTests = [];
				const outdatedClasses = [];

				console.log(`Querying Apex ${capitalize(pluralName)}...`);

				const classes = await this.__force.Tooling.findSObjects(
					sObjectName,
					[
						"Id", "Name", "IsValid", "Body", "ApiVersion"
					],
					new QueryFilter()
						.addEqualsClause(
							"NamespacePrefix",
							""
						).addEqualsClause(
						"Status",
						"Active"
					)
				);

				console.log("---------------------------------------------------");
				console.log(
					`Received information about ${classPlural(classes.length)}.`
				);

				let classCount = 0,
					testClassCount = 0;
				for (let clazz, wrapper, i = 0, j = classes.length; i < j; i++) {
					clazz = classes[i];

					//Check for test classes.  This is an imperfect method of
					//testing this and may contain false positives (if a class
					//contains ~"@istest" inside a comment, etc).
					//
					//Ideally, `ApexClass.SymbolTable.tableDeclaration.annotations`
					//would be used, however, this data is compiled on demand and
					//will lead to a significantly slower query.

					//If the class is NOT a test class
					if(clazz.Body.toLowerCase().indexOf("@istest") === -1) {
						wrapper = new ApexClass(clazz);
						this.__idToClass.set(
							wrapper.id,
							wrapper
						);
						classCount++;
					}

					//If the class IS a test class
					else {
						wrapper = new ApexTestClass(clazz);
						this.__idToTestClass.set(
							wrapper.id,
							wrapper
						);
						if(wrapper.seeAllData === true) {
							seeAllDataTests.push(wrapper);
						}
						testClassCount++;
					}

					//Check class validity
					if(wrapper.isValid !== true) {
						invalidClasses.push(wrapper);
					}

					//Prior to API version 27, test methods could exist
					//within their parent class or trigger.  Without
					//using `SymbolTable`, or complex logic, it is not
					//possible to consider such classes here.
					if(wrapper.apiVersion <= MINIMUM_API_VERSION) {
						outdatedClasses.push(wrapper);
					}

				}

				if(suppressWarnings !== true) {
					for(let i = 0, j = invalidClasses.length; i < j; i++) {
						console.warn(
							`WARNING: Class ${invalidClasses[i].name} needs to be recompiled for proper test coverage.`
						);
					}
					for(let i = 0, j = seeAllDataTests.length; i < j; i++) {
						console.warn(
							`WARNING: Class ${seeAllDataTests[i].name} uses seeAllData annotation.`
						);
					}
				}

				//These are technically errors and should not be suppressed
				for(let clazz, i = 0, j = outdatedClasses.length; i < j; i++) {
					clazz = outdatedClasses[i];
					console.error(
						`ERROR: Class ${clazz.name} is set to API version ${clazz.apiVersion}.`
					);
				}

				console.info(
					`There are ${classPlural(classCount)} and ${testClassCount} test ${pluralize(testClassCount, singularName, pluralName)}.`
				);

				resolve();
			} catch(ex) {
				reject(ex);
			}
		});
	}

	/**
	 * Checks the current status of a test execution.
	 *
	 * @param {string} testExecutionId
	 * @returns {Promise<TestRunResult>}
	 * @private
	 */
	async __checkTestRunStatus(testExecutionId) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.__force.Tooling.findSObjects(
					"ApexTestRunResult",
					[
						"ClassesCompleted",
						"ClassesEnqueued",
						"MethodsCompleted",
						"MethodsEnqueued",
						"MethodsFailed",
						"StartTime",
						"EndTime",
						"TestTime",
						"Status"
					],
					new QueryFilter().addEqualsClause(
						"AsyncApexJobId",
						testExecutionId
					)
				);

				//Reject if the job cannot be found
				if(!result || result.length === 0) {
					reject(new Error(
						`Unable to find async apex job with ID "${testExecutionId}".`
					));
				}

					//If the job can be found, wrap the result and
				//resolve.
				else {
					const output = new TestRunResult(
						Array.isArray(result)
							? result[0]
							: result
					);
					resolve(output);
				}
			} catch(ex) {
				reject(ex);
			}
		});
	}

	/**
	 *
	 * @param testExecutionId
	 * @returns {Promise<void>}
	 * @private
	 */
	async __getTestFailures(testExecutionId) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log('---------------------------------------------------');
				console.log(`Checking for failed tests (${testExecutionId}).`);

				const apexTestResults = await this.__force.Tooling.findSObjects(
					"ApexTestResult",
					[
						"Outcome",
						"ApexClass.Name",
						"ApexClassId",
						"MethodName",
						"Message",
						"StackTrace"
					],
					new QueryFilter()
						.addEqualsClause(
							"AsyncApexJobId",
							testExecutionId
						)
						.addNotEqualsClause(
							"Outcome",
							"Pass"
						)
				);

				const resultCount = apexTestResults.length;
				console.log(
					`${pluralizeWithNumber(resultCount, " failure has", "failures have")} been found.`
				);

				for (let record, failure, apexClass, i = 0; i < resultCount; i++) {
					record = apexTestResults[i];
					apexClass = this.__idToTestClass.get(record.ApexClassId);

					//Handle an unexpected class
					if(!apexClass) {
						reject(new Error(
							`Unable to find apex class "${record.ApexClass.Name} (${record.ApexClassId}) to record test failure: ${record.Message}.`
						))
						return;
					}
					failure = new TestFailure(record);
					apexClass.addFailure(failure);
					console.warn(
						`${apexClass.name}.${failure.methodName} : ${failure.outcome} - ${failure.message}\n${failure.stackTrace}`
					);
				}

				resolve();
			} catch(ex) {
				reject(ex);
			}
		});
	}

	async __getTestCoverage() {
		return new Promise(async (resolve, reject) => {
			try {
				console.log('---------------------------------------------------');
				console.log("Getting code coverage.");

				const records = await this.__force.Tooling.findSObjects(
					"ApexCodeCoverageAggregate",
					[
						"ApexClassOrTriggerId",
						"ApexClassOrTrigger.Name",
						"NumLinesCovered",
						"NumLinesUncovered"
					], undefined
					,"ApexClassOrTrigger.Name"
				);
				console.log(`Got Coverage for ${records.length} classes`);


				let linesCovered = 0,
					linesUncovered = 0;
				for(let record, apexClass, i = 0, j = records.length; i < j; i++) {
					record = records[i];
					apexClass = this.__idToClass.get(record.ApexClassOrTriggerId);
					if(!apexClass) {
						//Not so interested in test class' coverage
						continue;
					}
					apexClass.setCoverage(record);
					linesCovered += apexClass.linesCovered;
					linesUncovered += apexClass.linesUncovered;
				}

				const coverage = calculateCoverage(
					linesCovered,
					linesUncovered
				);

				console.info(`Total Org Coverage: ${coverage}%.`);

				this.__testingComplete = true;

				resolve();
			} catch(ex) {
				reject(ex);
			}
		});
	}

}