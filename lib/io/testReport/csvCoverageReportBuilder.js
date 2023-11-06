const {calculateCoverage} = require("../../util");
const CsvWriterFactory = require("csv-writer").createObjectCsvWriter;
const ApexClass = require("../../model/apexClass");
module.exports = class CsvCoverageReportBuilder {

	/**
	 * Generates a CSV coverage report.
	 *
	 * @param {string} fileName
	 * @param {ApexClass[]} apexClasses
	 */
	static async createReport(fileName, apexClasses) {
		return new Promise(async(resolve, reject) => {
			try {
				apexClasses = ApexClass.sortArrayByName(apexClasses);
				let totalLinesCovered = 0,
					totalLinesUncovered = 0;
				const header = [
					{
						//The underscores here ensure that
						//a class with the same name cannot
						//exist.
						id: "_total__coverage_",
						title: "Total Coverage"
					}
				];
				const bodyData = {};

				for (let apexClass, i = 0, j = apexClasses.length; i < j; i++) {
					apexClass = apexClasses[i];
					totalLinesCovered += apexClass.linesCovered;
					totalLinesUncovered = apexClass.linesUncovered;
					header.push({
						id: apexClass.name,
						title: apexClass.name
					});
					bodyData[apexClass.name] = apexClass.coverage;
				}
				bodyData["_total__coverage_"] = calculateCoverage(
					totalLinesCovered,
					totalLinesUncovered
				);

				const writer = CsvWriterFactory({
					path: fileName,
					header: header
				});
				await writer.writeRecords([bodyData]);

				resolve();
			} catch (ex) {
				reject(ex);
			}
		});
	}

};