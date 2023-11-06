const fs = require("graceful-fs");
//Required to handle ".handlebars" files.
require("handlebars");

const {
	calculateCoverage
} = require("../../util");

const TEMPLATE_EMPTY_HTML = require("../../templates/emptyHtml.handlebars");
const TEMPLATE_COVERAGE_CHART = require("../../templates/htmlReport/coverageChart.handlebars");
const TEMPLATE_HEADER = require("../../templates/htmlReport/header.handlebars");
const TEMPLATE_GENERIC_ERROR = require("../../templates/htmlReport/genericError.handlebars");
const TEMPLATE_RECOMPILE_LIST = require("../../templates/htmlReport/recompileList.handlebars");
const TEMPLATE_SEE_ALL_DATA_LIST = require("../../templates/htmlReport/seeAllDataList.handlebars");
const TEMPLATE_TEST_FAILURE_TABLE = require("../../templates/htmlReport/testFailureTable.handlebars");

/**
 * Constructs the HTML for the code coverage chart
 * portion of the HTML report.
 *
 * @param {ApexClass[]} apexClasses
 * @param {string} [requiredCoverageLabel]
 * @param {number} [requiredCoverageValue]
 */
const buildCoverageChart = (apexClasses, requiredCoverageLabel, requiredCoverageValue) => {
	//Handle non-inputs
	if(apexClasses.length === 0) {
		return TEMPLATE_GENERIC_ERROR({
			header : "Apex Test Coverage",
			message : "No apex classes can be found."
		});
	}

	const resultCount = apexClasses.length;

	//Collate the test class names and their
	//coverage.
	const axisLabels = [],
		axisValues = [];
	let totalLinesCovered = 0,
		totalLinesUncovered = 0;
	for(let apexClass, i = 0; i < resultCount; i++) {
		apexClass = apexClasses[i];

		//Count the total coverage
		totalLinesCovered += apexClass.linesCovered;
		totalLinesUncovered += apexClass.linesUncovered;

		//Store the class names and coverage levels
		axisLabels.push(apexClass.name);
		axisValues.push(apexClass.coverage);
	}

	//Get total org coverage
	const totalCoverage = calculateCoverage(
		totalLinesCovered,
		totalLinesUncovered
	);
	axisLabels.push("Total Local Coverage");
	axisValues.push(totalCoverage);


	const systemRequiredCoverage = JSON.stringify(fillArray(
		75,
		resultCount
	));
	const requiredCoverage = !requiredCoverageLabel || !requiredCoverageValue
		? null
		: JSON.stringify(fillArray(
			requiredCoverageValue,
			resultCount
		));

	const graphHeight = Math.floor(1000 + (apexClasses.length * 15));

	return TEMPLATE_COVERAGE_CHART({
		axisLabels : JSON.stringify(axisLabels),
		axisValues : JSON.stringify(axisValues),
		systemRequiredCoverage,
		requiredCoverageLabel,
		requiredCoverage,
		graphHeight
	});
}

/**
 * Constructs the HTML for the test failure table
 * portion of the HTML report.
 *
 * @param {ApexTestClass[]} apexTestClasses
 */
const buildFailureTable = (apexTestClasses) => {
	//Handle non-inputs
	if(apexTestClasses.length === 0) {
		return TEMPLATE_GENERIC_ERROR({
			header : "Test Failures",
			message : "No apex test classes can be found."
		});
	}

	const testClassesWithFailures = [];
	for(let apexTestClass, i = 0, j = apexTestClasses.length; i < j; i++) {
		apexTestClass = apexTestClasses[i];
		if(apexTestClass.hasFailures === true) {
			testClassesWithFailures.push(apexTestClass.toHandleBars());
		}
	}

	return TEMPLATE_TEST_FAILURE_TABLE(
		testClassesWithFailures
	);
}

/**
 * Constructs the HTML for the see all data list
 * portion of the HTML report.
 *
 * @param {ApexTestClass[]} apexTestClasses
 */
const buildSeeAllDataList = (apexTestClasses) => {
	//Handle non-inputs
	if(apexTestClasses.length === 0) {
		return TEMPLATE_GENERIC_ERROR({
			header : "Test Classes using the <code>@SeeAllData</code> annotation",
			message : "No apex test classes can be found."
		});
	}

	const seeAllDataTests = [];
	for(let apexTestClass, i = 0, j = apexTestClasses.length; i < j; i++) {
		apexTestClass = apexTestClasses[i];
		if(apexTestClass.seeAllData === true) {
			seeAllDataTests.push(apexTestClass.toHandleBars());
		}
	}
	return TEMPLATE_SEE_ALL_DATA_LIST(seeAllDataTests);
}

/**
 * Constructs the HTML for the see all data list
 * portion of the HTML report.
 *
 * @param {ApexClass[]} apexClasses
 * @param {ApexTestClass[]} apexTestClasses
 */
const buildRecompileList = (apexClasses, apexTestClasses) => {

	//Handle non-inputs
	if(apexClasses.length === 0 && apexTestClasses.length === 0) {
		return TEMPLATE_GENERIC_ERROR({
			header : "Classes(s) need to be re-compiled for adequate testing and coverage",
			message : "No apex classes can be found."
		});
	}

	const classNamesNeedingRecompilation = [];
	//Collate stale classes
	for(let apexClass, i = 0, j = apexClasses.length; i < j; i++) {
		apexClass = apexClasses[i];
		if(apexClass.isValid === false) {
			classNamesNeedingRecompilation.push(apexClass.toHandleBars());
		}
	}
	//Collate stale test classes
	for(let apexClass, i = 0, j = apexClasses.length; i < j; i++) {
		apexClass = apexClasses[i];
		if(apexClass.isValid === false) {
			classNamesNeedingRecompilation.push(apexClass.toHandleBars());
		}
	}
	classNamesNeedingRecompilation.sort((a, b) => {
		if(a.name === b.name) {
			return 0;
		}
		return a < b ? -1 : 1;
	});

	return TEMPLATE_RECOMPILE_LIST(classNamesNeedingRecompilation);
}

/**
 * Creates an array of a given length, each entry
 * containing a given value.  Used to create
 * vertical rules on the coverage chart.
 *
 * @param {*} value
 * @param {number} length
 * @returns {*[]}
 */
const fillArray = (value, length) => {
	const output = [];
	for(let i = 0; i < length; i++) {
		output.push(value);
	}
	return output;
}

// noinspection JSUnresolvedVariable
module.exports = class TestHtmlReportBuilder {

	/**
	 * Creates a HTML report detailing test execution results.
	 *
	 * @param {string} fileName
	 * @param {ApexClass[]} apexClasses
	 * @param {ApexTestClass[]} apexTestClasses
	 * @param {string} [requiredCoverageLabel]
	 * @param {number} [requiredCoverageValue]
	 * @returns {Promise<void>}
	 */
	static async createReport(fileName, apexClasses, apexTestClasses, requiredCoverageLabel, requiredCoverageValue) {
		return new Promise(async(resolve, reject) =>  {
			try {

				//Sort the results alphabetically
				apexClasses.sort((a, b) => {
					const upperA = a.name.toUpperCase();
					const upperB = b.name.toUpperCase();
					if(upperA < upperB) {
						return 1;
					}
					if(upperA > upperB) {
						return -1;
					}
					return 0;
				})

				await fs.writeFile(
					fileName,
					TEMPLATE_EMPTY_HTML({
						title: "Test Report",
						header: TEMPLATE_HEADER(),
						body : [
							buildCoverageChart(
								apexClasses,
								requiredCoverageLabel,
								requiredCoverageValue
							),
							"<hr/>",
							buildFailureTable(
								apexTestClasses
							),
							"<hr/>",
							buildSeeAllDataList(
								apexTestClasses
							),
							"<hr/>",
							buildRecompileList(
								apexClasses,
								apexTestClasses
							)
						]
					}),
					{
						encoding: "utf8"
					}
				);
				resolve();
			} catch (ex) {
				reject(ex);
			}
		});
	}

};

