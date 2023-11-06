/*jslint browser: true, regexp: true */
/*global require, process, console */

/**
* Purpose: Retrieves the Limit Data from the Salesforce Rest service and outputs it as percentages remaining into a CSV file
* It will also log this to the Console with WARNING and ERROR prefixes for any limits over the defined levels
*
* Usage: To run this NodeJS needs to be installed and the required libraries
* Installing Libraries: npm install q fs lodash jsforce csv-write-stream
* Setup environment variables for
*   SFDC_URL="https://test.salesforce.com"
*   SFDC_USERNAME="someuser@somesfenv.com"
*   SFDC_PASSWORD=bigsecurepassword
*   SFDC_TOKEN="12312312312312321"
* Running (from the directory with the script and the node_modules folder): node getSFLimits.js
*/

var Q = require('q');
var fs = require('fs');
var lo = require('lodash');
var jsforce = require('jsforce');
var csvWriter = require('csv-write-stream');
// var nodemailer = require('nodemailer');

/** The salesforce client */
var sfdc_client = new jsforce.Connection({loginUrl : process.env.SFDC_URL});

var limitdata = {};
var csvData = {};

// When to flag for warning/error on limits REMAINING
var alertLevels = {
	'default': 		{ "Warning":50, "Error":10 },
	DataStorageMB: 	{ "Warning":25, "Error":10 },
};


var JenkinsPlotDataFile = 'limitdata.csv';
var rawdata = 'sfrawlimitdata.json';
var CSVFilename = 'limitdata.csv';

var sendAlertEmail = false; // Changes to false if alert levels are reached
var email_body = 'Hello\nJust checked SF limits using ' + process.env.SFDC_USERNAME + ', found the following over defined boundries:';

var emailServer = 'smtps://user%40gmail.com:pass@smtp.gmail.com';
var emailSender = '"Fred Foo" <foo@blurdybloop.com>';
var emailRecipients = 'bar@blurdybloop.com, baz@blurdybloop.com';

/*****************************************************************************/

/**
* Log into the salsforce instance
*/
var sfdcLogin = function () {
	'use strict';

	var deferred = Q.defer();

	console.log('Logging in as ' + process.env.SFDC_USERNAME);
	//console.log('Logging in as ' + process.env.SFDC_PASSWORD + process.env.SFDC_TOKEN);

	sfdc_client.login(process.env.SFDC_USERNAME, process.env.SFDC_PASSWORD + process.env.SFDC_TOKEN, function (error, res) {
		if (error) {
			deferred.reject(new Error(error));
		} else {
			console.log('Logged in');
			deferred.resolve();
		}
	});

	return deferred.promise;
};

/**
* Logout of the salsforce instance
*/
var sfdcLogout = function () {
	'use strict';

	var deferred = Q.defer();
	sfdc_client.logout(function (error, res) {
		if (error) {
			deferred.reject(new Error(error));
		} else {
			console.log('Logged out');
			deferred.resolve();
		}
	});

	return deferred.promise;
};

/**
* Gets the limit data from SF
*/
var getLimitState = function () {
	'use strict';

	var deferred = Q.defer();

	console.log('Fetching current Limit Data');

	sfdc_client.limits(function (error, data) {
		if (error) {
			deferred.reject(new Error(error));
		} else {
			console.log('Got information about ' + lo.size(data) + ' limits');
			limitdata = data;
			// Log the raw data to a JSON file
			fs.writeFile(rawdata, JSON.stringify(limitdata, null, 4), function (err) {
				if (err) return console.log(err);
			});
			deferred.resolve();
		}
	});

	return deferred.promise;
};


var processLimits = function() {
	'use strict';
	var deferred = Q.defer();

	lo.forEach(limitdata, function (row, key) {
		var limitName = key;
		var limitMax = row["Max"];
		var limitRem = row["Remaining"];
		var limitPercentage = lo.round((limitRem/limitMax)*100, 2);
		csvData[limitName] = limitPercentage;

		var alrtLevel = getAlertLevels(key);
		// Check each limit if we should throw a warning or error
		if (limitPercentage <= alrtLevel.Error) {
			email_body += '\n\tERROR: ' + limitName + ' is at ' + limitPercentage + '% (' + limitRem + '/' + limitMax + ')';
			console.log('ERROR: ' + limitName + ' is at ' + limitPercentage + '% (' + limitRem + '/' + limitMax + ')');
		} else if (limitPercentage <= alrtLevel.Warning) {
			email_body += '\n\tWARNING: ' + limitName + ' is at ' + limitPercentage + '% (' + limitRem + '/' + limitMax + ')';
			console.log('WARNING: ' + limitName + ' is at ' + limitPercentage + '% (' + limitRem + '/' + limitMax + ')');
		}
	});
	console.log('\n');
	console.log(csvData);

	//console.log('\n\n'+email_body);
	deferred.resolve();
	return deferred.promise;
}

var getAlertLevels = function (limitName) {
    var limit = alertLevels[limitName]
    if (limit == undefined || limit == null) {
        limit = alertLevels['default'];
    }

    return limit;
}

/**
* Write the csvData to CSV for use with the Jenkins Plot Plugin
* Also logs to console if warning/error level reached for each limit
*/
var writePlotDataForJenkins = function() {
	'use strict';

	var deferred = Q.defer();

	var writer = csvWriter();
	writer.pipe(fs.createWriteStream(JenkinsPlotDataFile));
	writer.write(csvData);
	writer.end();
	deferred.resolve();
	return deferred.promise;
}

/**
* Write the data to CSV for use with the in 2 columns
*/
var write2ColCSVFile = function() {
	'use strict';
	var writer = csvWriter(),
		deferred = Q.defer();
	writer.pipe(fs.createWriteStream(CSVFilename));

	lo.forEach(limitdata, function (row, key) {
		var limitName = key,
			limitMax = row["Max"],
			limitRem = row["Remaining"],
			limitPercentage = lo.round((limitRem/limitMax)*100, 2);

		writer.write({"Limit Name":limitName,"Limit Percentage":limitPercentage});

	});
	writer.end();
	deferred.resolve();
	return deferred.promise;
}

var sendAlertEmails = function() {
	'use strict';
	var deferred = Q.defer();

	if (sendAlertEmail) {
		// create reusable transporter object using the default SMTP transport
		var transporter = nodemailer.createTransport(emailServer);

		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: emailSender, // sender address
		    to: emailRecipients, // list of receivers
		    subject: 'Salesforce Limits Warning/Error', // Subject line
		    text: email_body, // plaintext body
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        return console.log(error);
		    }
		    console.log('Message sent: ' + info.response);
		});
	}
	deferred.resolve();
	return deferred.promise;
}

Q.fcall(sfdcLogin)
	.then(getLimitState)
	.then(processLimits)
	.then(writePlotDataForJenkins)
	//.then(sendAlertEmails)
	.catch(function (error) {
		'use strict';
		console.log(error);
	})
	.done(function () {
		'use strict';
		console.log('All done...');
		sfdcLogout();
	});