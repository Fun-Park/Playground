/*
* Author: Tony White - tony.white@smsmt.com
* Purpose: Login to a Salesforce Environment, identify the classes and triggers, run the test classes and generate a report about the test coverage
* Usage:
* 	Install NodeJS - https://nodejs.org/en/
*   From the getTestCoverage directory (with package.json) run
*	npm install
*	(this downloads the required packages defined in the package.json)
* 	to run the actual script, setup environment variables for
*		'sf_deploy_url' - either test.salesforce.com or login.salesforce.com
*		'sf_deploy_username' - salesforce username for the environment
*		'sf_deploy_password' - the password and security token for the salesforce environment
*	Finally run:
*	node getTestResults.js
*/

let csvWriter = require("csv-write-stream");
let jsforce = require("jsforce");
let sleep = require("system-sleep");
let lo = require("lodash");
let fs = require("fs");
let Q = require("q");
//let restler = require('restler');

/** The salesforce client */
let sfdc_client = new jsforce.Connection({loginUrl: 'https://' + process.env.sf_deploy_url, version: '47.0'});
sfdc_client.bulk.pollTimeout = 120000; //
sfdc_client.bulk.pollInterval = 10000; // Every 10secs as expect to be loading over 10K records

/** A map of class Ids to class information */
let id_to_class_map = {};

/** A map of test class Ids to class information */
let test_class_map = {};
let classes_to_be_recompiled = {};
let html_testClasses_seeAllData = '';
let apexJobID;

/** A map of the coverage stats */
let coverage_stats = {};

/** File name to write the CSV data to */
const CSVFilename = 'teststats.csv';
/** File name to write the HTML data to */
const HTMLFilename = 'teststats.html';


/**
 * Log into the Salesforce instance
 */
let sfdcLogin = function () {
    'use strict';

    let deferred = Q.defer();

    console.log('Logging in as ' + process.env.sf_deploy_username);

    sfdc_client.login(process.env.sf_deploy_username, process.env.sf_deploy_password, function (error) {
        if (error) {
            deferred.reject(error);
        } else {
            console.log('Logged in');
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Logout of the salesforce instance
 */
let sfdcLogout = function () {
    'use strict';

    let deferred = Q.defer();
    sfdc_client.logout(function (error) {
        console.log('---------------------------------------------------');
        if (error) {
            deferred.reject(error);
        } else {
            console.log('Logged out');
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Builds a map of class id to class data
 */
let buildClassIdToClassDataMap = function () {
    'use strict';

    let deferred = Q.defer();

    sfdc_client.tooling.sobject('ApexClass').find({
            NamespacePrefix: '',
            Status: 'Active'
        },
        {Id: 1, Name: 1, Body: 1, IsValid: 1},
        {limit: 10000}
    ).sort('Name').execute({autoFetch: true, maxFetch: 10000}, function (error, data) {
            if (error) {
                deferred.reject(error);
            } else {
                console.log('---------------------------------------------------');
                console.log('Got information about ' + lo.size(data) + ' classes');
                if (lo.size(data) === 200) {
                    console.log('#####  WARNING only 200 classes retrieved, possible limit issue ######');
                }

                lo.forEach(data, function (row) {
                    if (!row.IsValid) {
                        console.log('WARNING: Class ' + row.Name + ' needs to be recompiled for proper test coverage');
                        classes_to_be_recompiled[row.Name] = row.Name;
                    }
                    if (row.Body.toLowerCase().indexOf('@istest') === -1) {
                        id_to_class_map[row.Id] = {
                            name: row.Name,
                            //source: row.Body,
                            coverage: []
                        };
                    } else {
                        test_class_map[row.Id] = {
                            name: row.Name,
                            //source: row.Body,
                            usesSeeAllData: row.Body.toLocaleLowerCase().includes('seealldata'),
                            failures: []
                        };
                        if (test_class_map[row.Id].usesSeeAllData) {
                            console.log('WARNING: ' + test_class_map[row.Id].name + ' uses seeAllData annotation.');
                            html_testClasses_seeAllData = html_testClasses_seeAllData + '\t<li>' + row.Name + '</li>';
                        }
                    }
                });
                console.log('There are ' + lo.size(id_to_class_map) + ' classes and ' + lo.size(test_class_map) + ' test classes.');

                deferred.resolve();
            }
        }
    );

    return deferred.promise;
};

let buildAddTriggersToClassIDMap = function () {
    'use strict';

    let deferred = Q.defer();

    // Get the Trigger info too
    sfdc_client.tooling.sobject('ApexTrigger').find({NamespacePrefix: '', Status: 'Active'}, {
        Id: 1,
        Name: 1,
        Body: 1,
        IsValid: 1
    }).sort('Name').execute({autoFetch: true, maxFetch: 10000}, function (error, triggerData) {
        if (error) {
            deferred.reject(error);
        } else {
            console.log('---------------------------------------------------');
            console.log('Got information about ' + lo.size(triggerData) + ' triggers');

            lo.forEach(triggerData, function (row) {
                if (!row.IsValid) {
                    console.log('WARNING: Trigger ' + row.Name + ' needs to be recompiled for proper test coverage');
                    classes_to_be_recompiled[row.Name] = row.Name;
                }
                if (row.Body.toLowerCase().indexOf('@istest') === -1) {
                    id_to_class_map[row.Id] = {
                        name: row.Name,
                        //source: row.Body,
                        coverage: []
                    };
                } else {
                    test_class_map[row.Id] = {
                        name: row.Name,
                        //source: row.Body
                    };
                }
            });

            // console.log(JSON.stringify(id_to_class_map, null, 4));
            deferred.resolve();
        }
    });
};

/**
 * Runs all tests with the tooling api
 */
let runAllTests = function () {
    'use strict';

    let class_ids = lo.keys(test_class_map),
        deferred = Q.defer();

    sfdc_client.tooling.runTestsAsynchronous(class_ids, function (error, data) {
        if (error) {
            console.log(JSON.stringify(error, null, 4));
            deferred.reject(error);
        } else {
            apexJobID = data;
            deferred.resolve(data);
        }
    });

    return deferred.promise;
};

/**
 * Query the test results
 *
 * @param testRunId The id of the test run
 * @param deferred The Q.defer instance
 */
let queryTestResults = function myself(testRunId, deferred) {
    'use strict';

    let isComplete = true;

    let pending = 0;
//	testRunId = '707N000000vrUDe';

    sfdc_client.query('select Id, Status, ApexClassId from ApexTestQueueItem where ParentJobId = \'' + testRunId + '\'', function (error, data) {
        if (error) {
            deferred.reject(error);
        } else {
            lo.each(data.records, function (row) {
                if (row.Status === 'Queued' || row.Status === 'Processing') {
                    isComplete = false;
                    pending++;
                }
            });

            if (isComplete) {
                deferred.resolve();
            } else {
                let sleepTime = Math.ceil(pending / 10) * 10;
                console.log('There are ' + pending + ' still running, sleeping for ' + sleepTime + ' seconds before checking again.');
                sleep(sleepTime * 1000);
                myself(testRunId, deferred);
            }
        }
    });
    return deferred;
};

/**
 * Waits until all tests are completed
 *
 * @param testRunId The id of the test run
 */
let waitUntilTestsComplete = function (testRunId) {
    'use strict';

    let deferred = Q.defer();
    console.log('---------------------------------------------------');
    queryTestResults(testRunId, deferred);

    return deferred.promise;
};

/**
 * After test completion get any failed test details
 */
let queryFailedTests = function () {
    'use strict';
    let deferred = Q.defer();
    console.log('---------------------------------------------------');
    console.log('Checking for failed tests (' + apexJobID + ')');
    let failedQuery = 'SELECT Id, Outcome, ApexClassId, MethodName, Message, StackTrace FROM ApexTestResult WHERE Outcome = \'Fail\' AND AsyncApexJobId = \'' + apexJobID + '\' order by ApexClassId, MethodName';
    console.log(failedQuery);

    sfdc_client.query(failedQuery, function (error, data) {
        if (error) {
            deferred.reject(error);
        } else {
            lo.each(data.records, function (row) {
                if (row.Outcome.toLowerCase() === 'fail') {
                    // add details of failures to the test class map
                    let apexClassName = test_class_map[row.ApexClassId].name;
                    test_class_map[row.ApexClassId].failures.push({
                        MethodName: row.MethodName,
                        Message: row.Message,
                        StackTrace: row.StackTrace
                    });
                    console.log(apexClassName + '.' + row.MethodName + ' : ' + row.Outcome + ' - ' + row.Message + '\n' + row.StackTrace);
                }
            });
            console.log('---------------------------------------------------');
            deferred.resolve();
        }
    });

    return deferred;
};

/**
 * Gets the test data and builds an array of the number of times the line was tested
 */
let buildCoverage = function () {
    'use strict';

    let max_line, coverage_size, class_id, i,
        deferred = Q.defer();

    console.log('Fetching code coverage information');
    coverage_stats['Total Org Coverage'] = {
        NumLinesCovered: 0,
        NumLinesUncovered: 0,
        TotalLines: 0,
        Coverage: 0
    };

    sfdc_client.tooling.sobject('ApexCodeCoverageAggregate').find({}).execute(function (error, data) {
        if (error) {
            deferred.reject(error);
        } else {
            console.log('Got information about ' + lo.size(data) + ' tests');

            lo.forEach(data, function (row) {
                class_id = row.ApexClassOrTriggerId;

                if (lo.has(id_to_class_map, class_id)) {
                    let class_name = lo.toString(id_to_class_map[class_id].name);
                    coverage_stats[class_name] = {
                        NumLinesCovered: row.NumLinesCovered,
                        NumLinesUncovered: row.NumLinesUncovered,
                        TotalLines: (row.NumLinesCovered + row.NumLinesUncovered),
                        Coverage: lo.round((((row.NumLinesCovered + row.NumLinesUncovered) - row.NumLinesUncovered) / (row.NumLinesCovered + row.NumLinesUncovered)) * 100, 2)
                    };
                    coverage_stats['Total Org Coverage'] = {
                        NumLinesCovered: (coverage_stats['Total Org Coverage'].NumLinesCovered + row.NumLinesCovered),
                        NumLinesUncovered: (coverage_stats['Total Org Coverage'].NumLinesUncovered + row.NumLinesUncovered),
                        TotalLines: (coverage_stats['Total Org Coverage'].TotalLines + row.NumLinesCovered + row.NumLinesUncovered)
                    };
                    coverage_stats['Total Org Coverage'].Coverage = lo.round(((coverage_stats['Total Org Coverage'].TotalLines - coverage_stats['Total Org Coverage'].NumLinesUncovered) / coverage_stats['Total Org Coverage'].TotalLines) * 100, 2);
                    //console.log(coverage_stats['Total Org Coverage']);
                    max_line = lo.max(lo.union(row.Coverage.coveredLines, row.Coverage.uncoveredLines));
                    coverage_size = lo.size(id_to_class_map[class_id].coverage);

                    if (max_line > coverage_size) {
                        for (i = coverage_size; i <= max_line; i += 1) {
                            id_to_class_map[class_id].coverage.push(null);
                        }
                    }

                    lo.forEach(row.Coverage.coveredLines, function (line_number) {
                        if (id_to_class_map[class_id].coverage[line_number - 1] === null) {
                            id_to_class_map[class_id].coverage[line_number - 1] = 1;
                        } else {
                            id_to_class_map[class_id].coverage[line_number - 1] += 1;
                        }
                    });

                    lo.forEach(row.Coverage.uncoveredLines, function (line_number) {
                        if (id_to_class_map[class_id].coverage[line_number - 1] === null) {
                            id_to_class_map[class_id].coverage[line_number - 1] = 0;
                        }
                    });
                }
            });
            deferred.resolve();
        }
    });

    return deferred.promise;
};

/**
 * Process data to CSV
 */
// let saveToCSVRows = function () {
// 	'use strict';
//
// 	//console.log(coverage_stats);
//
// 	let writer = csvWriter(),
// 		deferred = Q.defer();
// 	writer.pipe(fs.createWriteStream(CSVFilename));
// 	//coverage_stats.sort();
//
// 	lo.forEach(coverage_stats, function (row, apexClassName) {
//
// 		writer.write({"Apex Class/Trigger Name":apexClassName,"Coverage Percentage":row['Coverage']});
//
// 		if (apexClassName === 'Total Org Coverage') {
// 			console.log('Total Org Coverage: ' + row['Coverage'] + ' (' + row['NumLinesCovered'] + '/' + row['TotalLines'] + ')');
// 		}
// 	});
// 	writer.end();
// 	deferred.resolve();
// 	return deferred.promise;
// };

/**
 * Process data to CSV
 */
let saveToCSVCols = function () {
    'use strict';

    //console.log('Writing to file for Jenkins');

    let writer = csvWriter(),
        deferred = Q.defer();
    writer.pipe(fs.createWriteStream(CSVFilename));
    //coverage_stats.sort();

    writer.write(lo.mapValues(coverage_stats, 'Coverage'));

    console.log('Total Org Coverage: ' + coverage_stats['Total Org Coverage'].Coverage + ' (' + coverage_stats['Total Org Coverage'].NumLinesCovered + '/' + coverage_stats['Total Org Coverage'].TotalLines + ')');
    writer.end();
    deferred.resolve();
    return deferred.promise;
};

let writeHTML = function () {
    'use strict';

    let deferred = Q.defer();
    let graph_height = 1000 + (lo.size(coverage_stats) * 15);
    let html = '<head>\n  <!-- Plotly.js -->\n  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>\n</head>\n\n<body>\n  \n  <div id="myDiv" style="width: 100%; height: ' + graph_height + 'px;"><!-- Plotly chart will be drawn inside this DIV --></div>\n  <script>\n    <!-- JAVASCRIPT CODE GOES HERE -->';
    let script_end = ';\nlet layout = {\n\ttitle: \'Test Coverage\',\n\theight:' + graph_height + ',\n\thovermode:\'closest\',\n\tbarmode:\'overlay\',\n\tbargap:0.1,\n\tbargroupgap:0.1,\n\tmargin: {\n\t\tl:300,r:0,t:0,b:0,pad:1\n\t},\tshowlegend: true,\n\tlegend: {\n\t\tx: 0,\n\t\ty: 100\n\t},\n\tyaxis: {\n\t\tautotick:false,\n\t\tshowticklabels:true}\n\t};\nPlotly.newPlot(\'myDiv\', data, layout);</script>';
    let html_end = '</body>';

    let temp = lo.mapValues(coverage_stats, 'Coverage');
    console.log(temp);
    // Sort the keys (use case insensitive sorting)
    let keys = lo.keys(temp).sort(function (x, y) {
        let a = String(x).toUpperCase();
        let b = String(y).toUpperCase();
        if (a > b)
            return 1;
        if (a < b)
            return -1;
        return 0;
    }).reverse();
    // Remove the Total Org Coverage from the keys
    lo.pull(keys, 'Total Org Coverage');
    // Add it back at the end so it displays at the top of the graph
    keys.push('Total Org Coverage');
    let keys_str = '';
    let values_str = '';
    let sfCover = '';
    let qbccCover = '';
    try {
        lo.forEach(keys, function (key) {
            // console.log('key:' + keys_str.length + ', value:' + values_str.length);
            // console.log('sfCover:' + sfCover.length + ', qbccCover:' + qbccCover.length);
            if (keys_str.length === 0) {
                keys_str = keys_str + '\'' + key + '\'';
            } else {
                keys_str = keys_str + ', ' + '\'' + key + '\'';
            }

            let value = temp[key];
            if (values_str.length === 0) {
                values_str = values_str + value;
                sfCover = sfCover + 75;
                qbccCover = qbccCover + 85;
            } else {
                values_str = values_str + ', ' + value;
                sfCover = sfCover + ', ' + 75;
                qbccCover = qbccCover + ', ' + 85;
            }
        });
    } catch (error) {
        console.log('key:' + keys_str + ', values_str:' + values_str + ', sfCover:' + sfCover + ', qbccCover:' + qbccCover);

        deferred.reject(error);
        return deferred.promise;
    }

    let data = '\nlet trace1={\n\
    	name:\'Code Coverage %\',\n\
    	//hoverinfo:"x+y",\n\
    	y:[' + keys_str + '],\n\
    	x:[' + values_str + '],\n\
    	type: \'bar\',\n\
    	orientation:\'h\',\n\
    	showlegend: false\n\
    };\n\
    let trace2={\n\
    	name:\'Salesforce Required Coverage Level\',\n\
    	//hoverinfo:\'Salesforce Required Coverage Level\',\n\
    	y:[' + keys_str + '],\n\
    	x:[' + sfCover + '],\n\
    	type: \'scatter\',\n\
		mode:\'lines\',\n\
		showlegend: true,\n\
		marker: {\n\
			color: \'red\',\n\
			width: 3\n\
		}\n\
    };\n\
    let trace3={\n\
		name:\'QBCC Required Coverage Level\',\n\
		//hoverinfo:\'QBCC Required Coverage Level\',\n\
    	y:[' + keys_str + '],\n\
    	x:[' + qbccCover + '],\n\
    	type: \'scatter\',\n\
		mode:\'lines\',\n\
		showlegend: true,\n\
		marker: {\n\
			color: \'green\',\n\
			width: 3\n\
		}\n\
    };\n\
    let data=[trace1,trace2,trace3]';

    let failedTests = '';
    lo.forEach(test_class_map, function (testClass) {
        lo.forEach(testClass.failures, function (failure) {
            failedTests = failedTests + '\t<tr><td>' + testClass.name + '</td><td>' + failure.MethodName + '</td><td>' + failure.Message + '</td><td>' + failure.StackTrace + '</td></tr>';
        })
    });
    if (failedTests.length > 0) {
        failedTests = '<br/><H1>ERROR - Tests have failed</H1><Table><TH>Test Class Name</TH><TH>Test Method Name</TH><TH>Message</TH><TH>Stack Trace</TH>' + failedTests + '</Table>';
    }

    let uncompiledClasses = '';
    if (lo.size(classes_to_be_recompiled) > 0) {
        uncompiledClasses = '<br/><H1>WARNING these classes need to be recompiled in the org to allow proper Test Coverage to be calculated.</H1><br/><ul>\n';

        lo.forEach(classes_to_be_recompiled, function (value, key) {
            uncompiledClasses = uncompiledClasses + '\t<li>' + key + '</li>';
        });
        uncompiledClasses = uncompiledClasses + '</ul><br/>\n';
    }

    if (html_testClasses_seeAllData.length > 0) {
        html_testClasses_seeAllData = '<br/><H1>WARNING these Test Classes are using See All Data annotation</H1><br/><ul>\n' +
            html_testClasses_seeAllData + '</ul><br/>\n';
    }

    fs.writeFile(HTMLFilename, html + data + script_end + failedTests + html_testClasses_seeAllData + uncompiledClasses + html_end,
        (err) => {
            if (err) throw err;
        });
    deferred.resolve();
    return deferred.promise;
};

/**
 * Posts the data to coveralls
 */
// let postToCoveralls = function () {
// 	'use strict';

// 	let fs_stats, post_options,
// 		deferred = Q.defer(),
// 		coveralls_data = {
// 			repo_token: process.env.COVERALLS_REPO_TOKEN,
// 			service_name: 'travis-ci',
// 			service_job_id: process.env.TRAVIS_JOB_ID,
// 			source_files: lo.values(id_to_class_map)
// 		};

// 	console.log('Posting data to coveralls');

// 	fs.writeFile('/tmp/coveralls_data.json', JSON.stringify(coveralls_data), function (fs_error) {
// 		if (fs_error) {
// 			deferred.reject(new Error(fs_error));
// 		} else {
// 			fs_stats = fs.statSync('/tmp/coveralls_data.json');

// 			post_options = {
// 				multipart: true,
// 				data: {
// 					json_file: restler.file('/tmp/coveralls_data.json', null, fs_stats.size, null, 'application/json')
// 				}
// 			};

// 			restler.post('https://coveralls.io/api/v1/jobs', post_options).on("complete", function (data) {
// 				deferred.resolve();
// 			});
// 		}
// 	});

// 	return deferred.promise;
// };

Q.fcall(sfdcLogin)
    .then(buildClassIdToClassDataMap)
    .then(buildAddTriggersToClassIDMap)
    .then(runAllTests)
    .then(waitUntilTestsComplete)
    .then(queryFailedTests)
    .then(buildCoverage)
    .then(writeHTML)
    .then(saveToCSVCols)
    .catch(function (error) {
        'use strict';
        console.log(error);
    })
    .done(function () {
        'use strict';
        sfdcLogout();
    });