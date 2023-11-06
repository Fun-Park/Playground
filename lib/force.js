const JsForce = require("jsforce");
const fs = require('fs');
var xml2js = require('xml2js');
const Tooling = require("../lib/force/tooling");

/* This class is a generic wrapper for the jsforce
 * library.  The goal of this class is to create a
 * standardized authentication experience that can
 * be extended as required.
 *
 * When ES7 decorator functions are made available,
 * then
 */

/**
 * A generic wrapper for the jsforce library.
 */
class Force {

    jsForce;

    __tooling;

    /**
     * Constructs a new instance.
     *
     * @param {string} instanceUrl
     */
    constructor(instanceUrl) {
        if(!instanceUrl) throw new TypeError(
            "No instance URL has been provided."
        );
        console.log(`Creating connection for ${instanceUrl}.`);

        //Create the SF connection
        this.jsForce = new JsForce.Connection({
            loginUrl: instanceUrl
        });
        //Set the polling timeout to current maximum (10 minutes)
        this.jsForce.bulk.pollTimeout = 120000;
        //Set polling interval to 10 seconds (as there may be over 10K records)
        this.jsForce.bulk.pollInterval = 10000;
    }

    /**
     * Creates a new Salesforce connection and logs in.
     *
     * @param {string} username
     * @param {string} password
     * @returns {Promise<UserInfo>}
     */
    async login(username, password) {
        if(!username) throw new TypeError(
            'No Salesforce username has been provided.'
        );
        if(!password) throw new TypeError(
            'No Salesforce password has been provided.'
        );

        console.log(`Logging in as ${username}.`);
        await this.jsForce.login(
            username,
            password
        );
    }

    async logout() {
        console.log("Logging out of Salesforce.");
        await this.jsForce.logout();
    }

    async queryTestClasses(csvFilePath, packageXMLFilePath) {
        var changeFileNames = [];
        var siblingTestClassArray = [];
        
        var extractedData = "";
        var parser = new xml2js.Parser();
        var xml = fs.readFileSync(packageXMLFilePath, "utf8");
        var csvFileOut = fs.createWriteStream(csvFilePath);
        let sqlString =   " SELECT MetadataComponentId, MetadataComponentName, MetadataComponentType, RefMetadataComponentName, RefMetadataComponentType"
                        + " FROM MetadataComponentDependency "
                        + " WHERE MetadataComponentType = 'ApexClass'"
                        + " AND RefMetadataComponentType = 'ApexClass'"
                        // + " AND ( RefMetadataComponentType = 'ApexClass'"
                        // + "       OR RefMetadataComponentType = 'ApexTrigger')";
        // return this.jsForce.tooling.query(sqlString).stream().pipe(csvFileOut);
        this.jsForce.tooling.query(sqlString, function(err,result){
            if (err) {
                console.error(err);
              }
            // read delta XML File to get list of change apex file names
            parser.parseString(xml, function(err,result1){
                //Extract the value from the data element -- can not get text value
                for(var i=0;i<result1.Package.types.length;i++){
                    extractedData = result1.Package.types[i].name;
                    if((extractedData == 'ApexClass') ||(extractedData == 'ApexTrigger') ){
                        for(var j=0; j<result1.Package.types[i].members.length; j++){
                            changeFileNames.push(result1.Package.types[i].members[j]);
                            console.log('add query result');
                        }
                    }
                }
            });
            console.log('start look up');
            console.log('changed classes ' + changeFileNames.join(","));
            // lookup in full changed apex class list to get associated test class
            for(var f=0; f<changeFileNames.length; f++){
                var changeFileName = changeFileNames[f];
                console.log( 'changeFileName = ' + changeFileName);
                var isTestClassFound = false;
                for (var k=0; k < result.records.length; k++) {
                    var record = result.records[k];
                    if((record.RefMetadataComponentName == changeFileName) && record.MetadataComponentName.includes('Test')){
                        // just get any class name with Test include
                        
                        siblingTestClassArray.push(record.MetadataComponentName);
                        isTestClassFound = true;
                    }
                }
                if (!isTestClassFound ){
                  siblingTestClassArray.push(changeFileName + 'Test');   
                }
            }
            var  file = fs.createWriteStream(csvFilePath);
            file.write(""+ siblingTestClassArray.join(","));
            file.on('error', function(err) {  /* error handling */ 
                    console.error('There is an error writing the file ${csvFileOut} => ${err}')
                });
            file.on('finish', () => {
                    console.log('wrote all the array data to file ${csvFileOut} with content : ' + siblingTestClassArray.join(","));
                    });
            file.end();
			
			return siblingTestClassArray.join(",");
        });
    }

    //filter sibling test class base on inputChangesClass
    filterTestClasses(fullTestClassList, deltaPackageXMLFilePath){
        // read delta XML File to get list of change apex file names
        // lookup in full test class list to get associated test class
        // fill the result to output file for github action process in next step - deployment
    }



    /**
     * Exposes the Tooling class.
     *
     * @returns {Tooling}
     * @constructor
     */
    get Tooling() {
        if(!this.__tooling) {
            this.__tooling = new Tooling(this.jsForce);
        }
        return this.__tooling;
    }

}

module.exports = Force;