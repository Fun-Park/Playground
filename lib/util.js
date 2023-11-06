const SfDate = require("jsforce/lib/date")

/**
 * Calculates the code coverage based on the
 * lines covered and uncovered.
 *
 * @param {number} linesCovered
 * @param {number} linesUncovered
 * @returns {number}
 */
const calculateCoverage = (linesCovered, linesUncovered) => {
    if(linesCovered === 0) return 0;
    if(linesUncovered === 0) return 100;
    return Math.round(linesCovered / (linesCovered + linesUncovered) * 10000) / 100;
};

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} text
 * @returns {string|*}
 */
const capitalize = (text) => {
    if(!text) return text;
    return `${text[0].toUpperCase()}${text.slice(1)}`;
};

/**
 * Converts a salesforce Date or Datetime into a
 * Javascript Date (which also stores time data).
 * Returns NULL if a falsy value is provided.
 *
 * @param {string} salesforceDate
 * @returns {null|Date}
 */
const parseSalesforceDate = (salesforceDate) => {
    return !salesforceDate
        ? null
        : SfDate.parseDate(salesforceDate);
};

/**
 * Returns the singular or plural version of a given
 * string based on the specified number (i.e. if "1"
 * is provided, then the singular word will be
 * returned, otherwise the plural will be).
 * <br/><br/>
 * If no plural is specified, then the singular will
 * just be appended with the letter "s".
 *
 * @param {number} number
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
const pluralize = (number, singular, plural) => {
    if(number === 1) return singular;
    return !plural
        ? `${singular}s`
        : plural;
};

/**
 * Returns the singular or plural version of a given
 * string based on the specified number (i.e. if "1"
 * is provided, then the singular word will be
 * returned, otherwise the plural will be).
 * <br/><br/>
 * The output is prefixed with the specified number
 * and a space.
 * <br/><br/>
 * If no plural is specified, then the singular will
 * just be appended with the letter "s".
 *
 * @param {number} number
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
const pluralizeWithNumber = (number, singular, plural) => {
    return `${number} ${pluralize(number, singular, plural)}`;
};

/**
 * Asynchronously waits for a specified amount of
 * time.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
const wait = async (milliseconds) => {
    return new Promise(resolve => {
        setTimeout(
            () => {
                resolve();
            },
            milliseconds
        );
    });
};

// noinspection JSUnresolvedVariable
module.exports = {
    calculateCoverage,
    capitalize,
    parseSalesforceDate,
    pluralize,
    pluralizeWithNumber,
    wait
};