const {cleanJson} = require("./modelUtil");

module.exports = class ApexBase {

    /**
     * The class' Salesforce ID.
     *
     * @type {string}
     * @private
     */
    __id;

    /**
     * The class' name.
     *
     * @type {string}
     * @private
     */
    __name;

    /**
     * Is the class valid (i.e. does not require
     * recompilation)?
     *
     * @type {boolean}
     * @private
     */
    __isValid;

    /**
     * The class' API version.
     *
     * @type {number}
     * @private
     */
    __apiVersion;

    /**
     * Constructs a new instance.
     *
     * @param {Record} queriedClass
     */
    constructor(queriedClass) {
        // noinspection JSValidateTypes
        this.__id = queriedClass.Id;
        // noinspection JSValidateTypes
        this.__name = queriedClass.Name;
        // noinspection JSValidateTypes
        this.__isValid = queriedClass.IsValid;
        // noinspection JSValidateTypes
        this.__apiVersion = queriedClass.ApiVersion;
    }

    /**
     * Overrides the default toJSON method.
     *
     * @returns {null|{}}
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
                "__id" : "id",
                "__name" : "name",
                "__isValid" : "isValid",
                "__apiVersion" : "apiVersion"
            }
        );
    }

    /**
     * The class' Salesforce ID.
     *
     * @returns {string}
     */
    get id() {
        return this.__id;
    }

    /**
     * The class' name.
     *
     * @returns {string}
     */
    get name() {
        return this.__name;
    }

    /**
     * Is the class valid (i.e. does not require
     * recompilation)?
     *
     * @returns {boolean}
     */
    get isValid() {
        return this.__isValid;
    }

    /**
     * The class' API version.
     *
     * @returns {number}
     */
    get apiVersion() {
        return this.__apiVersion;
    }

    /**
     * Returns a list of classes, sorted by name.
     *
     * @param {ApexBase[]|ApexClass[]|ApexTestClass[]} classes
     */
    static sortArrayByName(classes) {
        const output = [...classes];
        output.sort((a, b) => {
            const aName = a.name.toLocaleLowerCase();
            const bName = b.name.toLocaleLowerCase();
            if(aName === bName) {
                return 0;
            }
            return a < b ? 1 : -1;
        });
        return output;
    }

};