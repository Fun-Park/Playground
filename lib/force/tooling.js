const DmlResult = require("./../model/dmlResult");
const QueryFilter = require("./../query/queryFilter");
const {pluralizeWithNumber} = require("./../util");
const QUERY_SIZE = 2000;

/**
 * Recursive function to retrieve records in batches.
 *
 * @param {Connection} jsForce
 * @param options
 * @returns {Promise<Query.<Array.<Record>>>}
 * @private
 */
__sObjectSearchRecursive = async (jsForce, options) => {
	let chain = jsForce.tooling.sobject(options.sObjectName)
		.find(
			options.filters,
			options.fields
		);
	if(!!options.sortBy) chain = chain.sort(options.sortBy);
	const records = await chain.limit(QUERY_SIZE)
		.skip(options.offset)
		.execute();
	options.hasMore = records.length === QUERY_SIZE;
	options.offset += records.length;
	return records;
}

/**
 * Recursive function to retrieve records in batches.
 *
 * @param {Connection} jsForce
 * @param options
 * @returns {Promise<Query.<Array.<Record>>>}
 * @private
 */
 __sObjectSearchNonRecursive = async (jsForce, options) => {
	let chain = jsForce.tooling.sobject(options.sObjectName)
		.find(
			options.filters,
			options.fields
		);
	if(!!options.sortBy) chain = chain.sort(options.sortBy);
	const records = await chain.limit(QUERY_SIZE)
		.execute();
	return records;
}

// noinspection JSUnresolvedVariable
module.exports = class Tooling {

	__jsForce;

	/**
	 * Constructs a new instance.
	 *
	 * @param {Connection} jsForce
	 */
	constructor(jsForce) {
		this.__jsForce = jsForce;
	}

	/**
	 * Searches for records of a given type using the
	 * Tooling API.
	 *
	 * @example
	 *  //Returns all ApexTestQueueItems whose parent job
	 *  //matches the specified ID, ordered by Status
	 *  //ascending and then Name descending.
	 *  const records = await force.Tooling.findSObjects(
	 *      "ApexTestQueueItem",
	 *      [
	 *          "Id",
	 *          "Status",
	 *          "ApexClassId"
	 *      ],
	 *      {
	 *          ParentJobId : "7075P0000000001"
	 *      },
	 *      "Status -Name"
	 *  );
	 *
	 * @param {string} sObjectName
	 * @param {string[]|string} [fields]
	 * @param {QueryFilter} [filter]
	 * @param {string} [sortBy]
	 * @returns {Promise<Record[]>}
	 */
	async findSObjects(sObjectName, fields, filter, sortBy) {
		let options = {
			sObjectName: sObjectName,
			fields : Tooling.__resolveQueryFields(fields),
			filters : !filter ? {} : filter.value,
			sortBy : sortBy,
			offset : 0,
			hasMore : null
		};

		const results = [];
		while(options.hasMore !== false) {
			results.push(
				...(
					await __sObjectSearchRecursive(this.__jsForce, options)
				)
			);
		}
		return results;
	}

	async findSObjectsNonRecursive(sObjectName, fields, filter, sortBy) {
		let options = {
			sObjectName: sObjectName,
			fields : Tooling.__resolveQueryFields(fields),
			filters : !filter ? {} : filter.value,
			sortBy : sortBy,
		};

		const results = [];
		results.push(
			...(
				await __sObjectSearchNonRecursive(this.__jsForce, options)
			)
		);
		return results;
	}

	/**
	 * Ensures that a value provided (or omitted) for a query's
	 * fields is valid.
	 *
	 * @param {string[]|string} [fields]
	 * @private
	 */
	static __resolveQueryFields(fields) {
		if(!fields) return "*";
		if(typeof fields === "string") return fields;
		return [...fields];
	}

	/**
	 * Updates a record or array or records using the
	 * Tooling API.
	 *
	 * @param {string} sObjectName
	 * @param {Record|Record[]} records
	 * @returns {Promise<DmlResult>}
	 */
	async update(sObjectName, records) {
		return new Promise(async (resolve, reject) => {
			try {
				const results = await this.__jsForce.tooling.update(
					sObjectName,
					records
				);
				resolve(new DmlResult(results));
			} catch (ex) {
				reject(ex);
			}
		});
	}

	/**
	 * Schedules an asynchronous test execution of the given test
	 * classes.  Returns the test execution ID.
	 *
	 * @param {Map<string, ApexTestClass>} idToTestClass
	 * @returns {Promise<string>}
	 */
	async runTestsAsync(idToTestClass) {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.__jsForce.tooling.runTestsAsynchronous(
					Array.from(idToTestClass.keys())
				);
				resolve(result);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	async abortAllTests() {
		return new Promise(async (resolve, reject) => {
			try {
				//Cancel the async jobs before they can
				//spawn any new tests
				const asyncApexJobs = await this.findSObjects(
					"AsyncApexJob",
					[
						"Id"
					],
					new QueryFilter().addInClause(
						"JobType",
						[
							"TestRequest",
							"TestWorker"
						]
					).addNotInClause(
						"Status",
						[
							"Aborted",
							"Completed",
							"Failed"
						]
					)
				);

				//Cancel the async apex jobs (AsyncApexJob)
				if(asyncApexJobs.length === 0) {
					console.log(
						"Found 0 test AsyncApexJob records."
					);
				} else {
					console.log(
						`Aborting ${pluralizeWithNumber(asyncApexJobs.size, "test AsyncApexJob")}.`
					);
					await this.abortAsyncApexJobs(
						asyncApexJobs.map(({Id}) => Id)
					);
				}

				//Get all running tests
				const records = await this.findSObjects(
					"ApexTestQueueItem",
					[
						"Id",
						"ParentJobId"
					],
					new QueryFilter().addNotInClause(
						"Status",
						[
							"Aborted",
							"Completed",
							"Failed"
						]
					)
				);

				//Set the tests to "Aborted":
				const recordCount = records.length;
				if(recordCount === 0) {
					console.log(
						"Found 0 test ApexTestQueueItem records."
					);
				} else {
					console.info(
						`Aborting ${pluralizeWithNumber(recordCount, "ApexTestQueueItem")}.`
					);
					const recordsForUpdate = [];
					//Create the test records for update
					for(let record, i = 0; i < recordCount; i++) {
						record = records[i];
						recordsForUpdate.push({
							Id : record.Id,
							Status : "Aborted"
						});
					}

					//Perform the DML
					const dmlResult = await this.update(
						"ApexTestQueueItem",
						recordsForUpdate
					);

					//Check that there are no errors
					if(dmlResult.hasErrors === true) {
						const errors = dmlResult.getErrors();
						for(let i = 0, j = errors.length; i < j; i++) {
							console.error(
								`ERROR: Cannot abort test execution. ${errors[i]}`
							);
						}
						reject(new Error(
							`Unable to abort tests: ${errors[0]}`
						));
						return;
					}
				}

				resolve();
			} catch(ex) {
				reject(ex);
			}
		});
	}

	async abortAsyncApexJobs(asyncJobIds) {
		return new Promise(async (resolve, reject) => {
			try {
				//Build the command to execute
				const commandParts = [];
				for(let i = 0, j = asyncJobIds.length; i < j; i++) {
					commandParts.push(
						`System.abortJob('${asyncJobIds[i]}');`
					);
				}

				//Execute the command
				const result = await this.__jsForce.tooling.executeAnonymous(
					commandParts.join("\n")
				);

				//Handle results
				if(result.success) {
					resolve();
				} else {
					if(result.compiled === true) {
						reject(new Error(
							`${result.exceptionMessage}
                            ${result.exceptionStackTrace}`
						));
					} else {
						reject(new Error(result.compileProblem));
					}
				}
				resolve();
			} catch(ex) {
				reject(ex);
			}
		});
	}

}