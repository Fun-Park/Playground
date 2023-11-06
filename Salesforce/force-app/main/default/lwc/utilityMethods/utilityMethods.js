import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import deepClone from "./cloneUtil";

const today = () => {
    let todayDate = new Date();
    let month = '0' + (todayDate.getMonth() + 1).valueOf();
    month = month.substring(month.length - 2);
    let dayStr = '0' + todayDate.getDate().valueOf();
    dayStr = dayStr.substring(dayStr.length - 2);
    return todayDate.getFullYear() + "-" + month + "-" + dayStr;
};

const yesterday = () => {
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let month = '0' + (date.getMonth() + 1).valueOf();
    month = month.substring(month.length - 2);
    let dayStr = '0' + date.getDate().valueOf();
    dayStr = dayStr.substring(dayStr.length - 2);
    return date.getFullYear() + "-" + month + "-" + dayStr;
}

const addDays = (theDate, days) => {
    return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
};

/**
 * This converts a parsable date or date-time string
 * into an ISO8601 date (not time) string.
 * <br/><br/>
 * A common use case for this function is to convert
 * a date stored in form data into a value suitable
 * for a lightning-input field.
 * <br/><br/>
 * This function returns a ISO8601 formatted date
 * string, or NULL if a falsey value is provided.
 * <br/><br/><br/>
 * <h2>Important</h2><br/>
 * <ul>
 *     <li>
 *         All time information provided will be
 *         ignored.
 *     </li>
 *     <li>
 *         If a date is provided, the local time
 *         values (not the GMT/UTC values) will be
 *         used.  Consider your use-case prior to
 *         use.
 *     </li>
 *     <li>
 *         If a string is provided, consider whether
 *         a timezone is attached.  The date will be
 *         converted into the local time prior to
 *         conversion, which may skew results.
 *     </li>
 * </ul>
 *
 * @param {Date|string} [dateOrString]
 * @returns {null|string} ISO8601 date string
 */
let getLocalIsoDateString = (dateOrString) => {
    //Return early if an empty value has been provided
    if (!dateOrString) {
        return null;
    }

    //If a date value has been provided, ensure that it is
    //valid, and build the output.
    if (dateOrString instanceof Date) {
        if (isDateValid(dateOrString) === false) {
            console.log(dateOrString);
            console.log(JSON.parse(JSON.stringify(dateOrString)));
            throw new TypeError(
                "Unable to build ISO date: Invalid date provided."
            );
        }
        return dateToLocalIsoString(dateOrString);
    }


        //If a string value has been provided, convert it to a
        //date, ensure that it is a valid date, and build the
    //output.
    else if (typeof dateOrString === "string") {
        const date = new Date(dateOrString);
        if (isDateValid(date) === false) {
            throw new TypeError(
                `Unable to build ISO date from the Date string provided: ${dateOrString}`
            );
        }
        return dateToLocalIsoString(date);
    }
}


    /**
 * This converts a parsable date or date-time string
 * into an ISO8601 date (not time) string.
 * <br/><br/>
 * A common use case for this function is to convert
 * a date stored in form data into a value suitable
 * for a lightning-input field.
 * <br/><br/>
 * This function returns a ISO8601 formatted date
 * string, or NULL if a falsey value is provided.
 * <br/><br/><br/>
 * <h2>Important</h2><br/>
 * <ul>
 *     <li>
 *         All time information provided will be
 *         ignored.
 *     </li>
 *     <li>
 *         If a date is provided, the local time
 *         values (not the GMT/UTC values) will be
 *         used.  Consider your use-case prior to
 *         use. 
 *         The method is applicable for 'dd/mm/yyyy' and 'dd mmm yyyy'
 *     </li>
 *     <li>
 *         If a string is provided, consider whether
 *         a timezone is attached.  The date will be
 *         converted into the local time prior to
 *         conversion, which may skew results.
 *     </li>
 * </ul>
 *
 * @param {Date|string} [dateOrString]
 * @returns {null|string} ISO8601 date string
 */
    let getLocalIsoDateStringForICU = (dateOrString) => {
        //Return early if an empty value has been provided
        if (!dateOrString) {
            return null;
        }
        //If a date value has been provided, ensure that it is
        //valid, and build the output.
        if (dateOrString instanceof Date) {
            if (isDateValid(dateOrString) === false) {
                throw new TypeError(
                    "Unable to build ISO date: Invalid date provided."
                );
            }
            return dateToLocalIsoString(dateOrString);
        }
        //If a string value has been provided, convert it to a
        //date, ensure that it is a valid date, and build the
        //output.
        else if (typeof dateOrString === "string") {
            // reformat if the input string is in dd/mm/yyyy
            if(dateOrString.indexOf('/') !== -1){
                var parts =dateOrString.split('/');
                dateOrString = parts[2]+"-"+parts[1]+ "-" +parts[0];
                // expected yyyy-mm-dd string value
            }
            const date = new Date(dateOrString);
            if (isDateValid(date) === false) {
                throw new TypeError(
                    `Unable to build ISO date from the Date string provided: ${dateOrString}`
                );
            }
            return dateToLocalIsoString(date);
        }

    //Otherwise, if we get here, an invalid type has been
    //provided.
    throw new TypeError(
        `Unable to build ISO date from the value provided.  Expected a date or string, received: ${typeof dateOrString}.`
    );
}

/**
 * This converts a JS Date instance into an ISO8601 date
 * (not time) string in the local timezone.
 *
 * @param {Date} [date]
 * @returns {null|string} ISO8601 date string
 */
const dateToLocalIsoString = date => !date ? null : `${
    //Get a four-digit year
    date.getFullYear()
}-${
    //Get a two-digit month.  Note that months returned
    //by get month are zero delimited.
    ("" + (date.getMonth() + 1)).padStart(2, "0")
}-${
    //Get a two digit day of the month
    ("" + date.getDate()).padStart(2, "0")
}`;

/**
 * Returns whether a JS Date instance is valid (i.e.
 * has had a valid date set).
 *
 * @param {Date} date
 * @returns {boolean}
 */
const isDateValid = date => {
    //Make sure that this looks like a date
    if (!date || !date.getTime) return false;
    //This is a simple way to tell if a date is
    //valid.  An invalid date will return NaN for
    //its numerical-returning methods.  NaN will
    //never equal NaN, thus this is an easy test.
    return date.getTime() === date.getTime();
}

const getQueryParameters = () => {
    let params = {};
    let search = location.search.substring(1);

    if (search) {
        params = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', (key, value) => {
            return key === "" ? value : decodeURIComponent(value)
        });
    }

    return params;
};

/**
 * Reports field validity for a given field element,
 * list of elements, or selector string.
 *
 * @param {HTMLElement, HTMLElement[], NodeList, HTMLCollection} fields
 * @returns {boolean}
 */
const reportFieldValidityAndFocus = (fields) => {
    if (!fields) return true;
    //Need to confirm whether this is an element, or
    //a collection of elements.  NodeLists are not
    //arrays.  They do both share an "entries"
    //property, but this, and many other properties
    //are inaccessible.
    const fieldArray = !fields[0] ? fields : fields;
    const fieldCount = fieldArray.length;
    if (fieldCount === 0) return true;
    let focused = false,
        allValid = true;
    for (let field, i = 0; i < fieldCount; i++) {
        field = fieldArray[i];
        if (!!field.reportValidity) {
            if (field.reportValidity() === false) {
                allValid = false;
                if (focused === false && !!field.focus) {
                    field.focus();
                    focused = true;
                }
            }
        }
    }
    return allValid;
}

// Sorts the array by the specified field
// Usage myData.sort(sortData(fieldName, sortDirection))
/**
 * Generates a sorting function that can be passed to the `sort`
 * function of an array of objects.
 *
 * The generated function will sort the array by a given property
 * in a given direction.
 *
 * @param {string} fieldName                The name of the property by which to sort the array.
 * @param {("asc"|"desc")} sortDirection    Should the array be sorted in a descending order.
 * @param {function} [primer]               An optional modifier function that can be used to manipulate the sorting property's value.
 * @returns {function(*=, *=): number}
 */
const sortData = (fieldName, sortDirection, primer) => {
    let reverse = sortDirection.toLowerCase() !== 'asc';
    let key = primer ?
        function (x) {
            return primer(x[fieldName])
        } :
        function (x) {
            return !(x[fieldName]) ? '' : x[fieldName];
        };
    //checks if the two rows should switch places
    reverse = !reverse ? 1 : -1;
    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
};

const convertToCSV = (objArray) => {
    let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line !== '') line += ',';

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
};

const exportCSVFile = (headers, items, fileTitle) => {
    if (headers) {
        items.unshift(headers);
    }

    // Convert Object to JSON
    let jsonObject = JSON.stringify(items);
    let csv = convertToCSV(jsonObject);

    let exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    // console.log(JSON.stringify(csv, null, 4));
    let blob = new Blob([csv], {type: 'text/plain'});
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        let link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

const filterData = (data, term, field) => {
    let result = data;
    let regEx = new RegExp(term, "i");
    try {
        result = data.filter(row => regEx.test(row[field]));
    } catch (e) {
        console.error(JSON.stringify(e, null, 4));
    }
    return result;
};

//Not an ES6+ function as we want "this" to be passed in using a bind.
/**
 * Depreciated. Please use parseError or displayErrorToast instead.
 *
 * @param {string|Error|FetchResponse} [err]
 * @param {string} [stack]
 * @private
 *
 * @deprecated
 */
const displayErrorMessage = function (err, stack) {
    //Handle when there is no error defined
    if (!err) {
        err = "An undefined error has occurred.";
    }

    //Get the error details:
    const message = err.message || (!err.body ? false : err.body.message) || "" + err;
    const name = err.name || "An Error has Occurred";

    //Print the error on the console for debug
    if (!!name) {
        console.error("Name:", name);
    }
    console.error("Message:", message);
    console.error("Initial Error:", err);
    //Display something more meaningful than locker service
    //would otherwise allow.
    console.error("Parsed Error:", JSON.parse(JSON.stringify(err)));
    if (!!stack) {
        console.error("Initial Stack:", stack);
    } else {
        console.trace("Generated stack trace");
    }

    //Attempt to display a message to the user.  This may
    //fail in unsupported contexts (such as Lightning Out)
    try {
        if (this && this.dispatchEvent) {
            this.dispatchEvent(new ShowToastEvent({
                title: name,
                message: message,
                variant: "error",
                mode: "dismissable"
            }));
        }
    } catch (ex) {
        console.error("Unable to show error toast:", ex);
    }
};

const randomString = length => {
    let totalLength = 0;
    let out = "";
    while (totalLength < length) {
        const randomString = Math.random()
            //Change the base to a full alphanumeric base
            //e.g. [0, 1, 2, ..., 8, 9, a, b, ..., y, z, 10, 11...]
            .toString(36);
        const randomLength = randomString.length - 2;
        if (randomLength > 0) {
            const subStringLength = Math.min(randomLength, length - totalLength);
            out += randomString.substr(2, subStringLength);
            totalLength += subStringLength;
        }
    }
    return out;
}

/**
 * @description Joins a given list of strings, comma delimited,
 * oxford style.  For example, "dog, goat, snake, and bird".
 *
 * @param {string[]} segments
 *  The strings to join.
 * @param {string} [coordinatingConjunctionToUse=and]
 *  The string value to use between the penultimate and ultimate
 *  segments.  For example, in "1, 2, and 3", the coordinating
 *  conjunction will be "and".
 * @returns {string}
 */
const oxfordJoin = (segments, coordinatingConjunctionToUse) => {
    if (!segments) {
        return "";
    }
    const count = segments.length;
    if (!count) {
        return "";
    }

    const conjunction = " " + (
        typeof coordinatingConjunctionToUse === "string"
            ? coordinatingConjunctionToUse.trim() || "and"
            : "and"
    ) + " ";

    //Handle special cases
    if (count === 1) {
        return segments[0];
    } else if (count === 2) {
        return segments[0] + conjunction + segments[1];
    }

    //We don't want to modify the actual list here
    const temp = [...segments];

    //For lists larger than 2 elements:
    //Remove and store the last element of the list
    const lastItem = temp.pop();

    //Join the remaining elements of the string concatenated with a comma,
    //followed by an "and" or "&", and finally followed by the last element
    //in the list
    return temp.join(', ') + "," + conjunction + lastItem;
}

let escapeElement;
const escapeHtml = html => {
    if (escapeElement === undefined) {
        escapeElement = document.createElement('textarea');
    }
    escapeElement.textContent = html;
    return escapeElement.innerHTML;
}

/**
 * Determines whether a string contains a non-whitespace
 * value.
 *
 * @param value
 * @return {boolean}
 */
const isStringEmpty = value => {
    if (!value) {
        return true;
    }
    return typeof value === "string" && !value.trim();
}

/**
 * Determines whether a rich text string contains a
 * non-whitespace value.
 *
 * @param value
 * @return {boolean}
 */
const isRichTextEmpty = value => {
    return isStringEmpty(stripHtml(value));
}

/**
 * Strips HTML from a string using the browser's native parser.
 *
 * @param value
 * @return {string}
 */
const stripHtml = value => {
    return DOM_PARSER.parseFromString(value, "text/html").body.textContent || "";
}
const DOM_PARSER = new DOMParser();

/**
 * Will generate a string describing the range between the specified `min` value
 * and the specified `max` value (if present).
 * <p/>
 * <br/>
 * <strong>Example inputs and outputs:</strong>
 * <br/>
 * <br/>
 * <strong>Neither max or min is provided:</strong> <code>""</code>
 * <br/>
 * <strong>Only min is provided (as say 1):</strong> <code>"at least 1"</code>
 * <br/>
 * <strong>Only max is provided (as say 42):</strong> <code>"no more than 42"</code>
 * <br/>
 * <strong>Both min (4) and max (12) are provided:</strong> <code>"between 4 and 12"</code>
 * <p/>
 * Specifying a `singularItemName` will enable the method to append a description of the
 * item being described, for example: <code>between 4 and 12 dogs</code>.  The plural version
 * will just be the `singularItemName` with an "s" appended to the end, unless a `pluralItemName`
 * is specified.
 *
 * @param {number} [min]
 * @param {number} [max]
 * @param {string} [singularItemName]
 * @param {string} [pluralItemName]
 */
const buildMinimaMaximaDescription = (min, max, singularItemName, pluralItemName) => {
    const hasMin = isNaN(min) === false;
    const hasMax = isNaN(max) === false;
    if (hasMin === true && hasMax === true) {
        const minString = min.toLocaleString();
        if (min === max) {
            return "exactly " + minString + __buildMinimaMaximaDescriptionName(min, singularItemName, pluralItemName);
        }
        const maxString = max.toLocaleString();
        return max > min
            ? `between ${minString} and ${maxString}` + __buildMinimaMaximaDescriptionName(max, singularItemName, pluralItemName)
            : `between ${maxString} and ${minString}` + __buildMinimaMaximaDescriptionName(min, singularItemName, pluralItemName);
    }
    if (hasMin === true) {
        return "at least " + min.toLocaleString() + __buildMinimaMaximaDescriptionName(min, singularItemName, pluralItemName);
    }
    if (hasMax === true) {
        return "up to " + max.toLocaleString() + __buildMinimaMaximaDescriptionName(max, singularItemName, pluralItemName);
    }
    return "";
}
const __buildMinimaMaximaDescriptionName = (value, itemName, pluralItemName) => {
    const singular = typeof itemName === "string"
        ? itemName.trim() || undefined
        : undefined;
    if (singular === undefined) {
        return "";
    }
    if (value === 1) {
        return " " + singular;
    }
    return typeof pluralItemName === "string"
        ? " " + (pluralItemName.trim() || singular + "s")
        : " " + singular + "s";
}

// sourced from - https://gist.github.com/penguinboy/762197
const flattenObject = function (ob) {
    let toReturn = {};

    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) == 'object') {
            let flatObject = flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

const inflateObject = (function () {
    const nodeSplit = function (key, original) {
        return function splitNode(node, nodes) {
            const name = nodes.shift();
            node[name] = (nodes.length >= 1) ? splitNode(node[name] || {}, nodes) : original[key];
            return node;
        };
    };
    return function (original) {
        const result = {};
        let prop,
            splitNode;
        for (prop in original) {
            if (original.hasOwnProperty(prop)) {
                nodeSplit(prop, original)(result, prop.split("."));
            }
        }
        return result;
    };
}());

const equalsIgnoringCase = function (text, other) {
    return (!text && !other) ||
        (!!text && text.localeCompare(other, 'en', {sensitivity: 'base'}) === 0);
};

/**
 * Add an error to a datatable error array
 *
 * @param datatableErrors the current datatable errors
 * @param rowId the id of the record to add the error against
 * @param rowNum the row number in the datatable data
 * @param fieldName the field that has the error
 * @param errorMessage the error message to use
 */
const addDatatableError = function (datatableErrors, rowId, rowNum, fieldName, errorMessage) {
    datatableErrors.table.messages.push(`Row ${rowNum} - ${errorMessage}`);
    if (fieldName) {
        let rowError = datatableErrors.rows[rowId];
        if (!rowError) {
            rowError = {
                title: 'Errors',
                messages: [],
                fieldNames: []
            };
        }
        rowError.messages.push(errorMessage);
        rowError.fieldNames.push(fieldName);
        datatableErrors.rows[rowId] = rowError;
    }
}

/**
 * Determine the row number for the record Id
 *
 * @param data array of data to search
 * @param rowId the id to find
 * @returns {number} the row number
 */
const getRowNumForId = function (data, rowId) {
    let rowNum = undefined;
    for (const record in data) {
        if (!data.hasOwnProperty(record)) {
            continue;
        }
        if (rowId === data[record].Id) {
            rowNum = parseInt(record) + 1;
            break;
        }
    }
    return rowNum;
}

/**
 * Determines whether two arrays containing only primitive values
 * contain the same primitive values in the same quantities.  The
 * order of items does not matter.
 * <p/>
 * A primitive value is not an object and has no methods.  For
 * example, string, boolean, numeric, null, and undefined values
 * would be considered primitive.
 * <p/>
 * <i>
 * This method will also work for any object that supports native
 * array sorting and the exact equality operator.  Use off-label
 * at own risk.
 * </i>
 *
 * @param {(boolean|number|string|null|undefined)[]} a1
 * @param {(boolean|number|string|null|undefined)[]} a2
 * @return {boolean}
 */
const arePrimitiveValueArraysEqual = (a1, a2) => {
    const size = a1.length;
    if (size !== a2.length) {
        return false;
    }
    const s1 = [...a1].sort(),
        s2 = [...a2].sort();
    for (let i = 0; i < size; i++) {
        if (s1[i] !== s2[i]) {
            return false;
        }
    }
    return true;
}
const validateUploadedFileName = filename => {
    let withoutExtension = filename.substring(0, filename.lastIndexOf('.'));
    return /^[A-Za-z0-9]+[\w\&\#\(\)\.\-\_\s]*$/.test(withoutExtension);
}
/**
 * @param filename
 * @return {boolean}
 */
const validateUploadedFileNameLength = filename => {
    return filename.length <= 50;
}

const acceptedFileTypes = ".doc, .docx, .bmp, .jpeg, .jpg, .pjpeg, .png, .pdf, .xls, .xlsx";

/**
 * Returns undefined if the supplied value is null or undefined, an empty string, or a
 * non-string data type.  Otherwise, returns the given string with whitespace trimmed.
 * datatype.
 * <br/><br/>
 * If a defaultValue is provided, then that value will be returned instead of undefined.
 *
 * @param {string|any} s
 *  The string to test (and possibly return).
 * @param {any} [defaultValue=undefined]
 *  The value to return if the provided string not valid.  This defaults to undefined, but
 *  can be overridden.
 *
 * @return {string|undefined|any}
 */
const trimmedStringOrUndefined = (s, defaultValue) => {
    return typeof s === "string"
        ? s.trim() || defaultValue
        : defaultValue;
}

const inExperienceBuilder = () => {
    const location = window.location;
    if (!location) {
        return false;
    }
    //In the Experience Builder and App Builder the site is hosted
    //in an iframe with an internal URL not visible in the browser
    //address bar.
    //Changes are here to support enhanced domains:
    //https://developer.salesforce.com/blogs/2022/07/your-salesforce-orgs-hostnames-are-changing-are-you-ready
    return (
        //Check for Experience builder - Remove after enhanced domains are live
        location.host.toLowerCase().includes(".livepreview.")
        //Check for Experience builder - Enhanced domains version
        || location.host.toLowerCase().includes(".live-preview.")
        //Check for Lightning App Builder
        || location.pathname.toLowerCase().includes("flexipageeditor/surface.app")
    );
}

// (div.slds-modal > div.) ensures it is only applied to the main modal not sub modals eg cancel form or manual site modal
const MODAL_SIZE_70_PERCENT = 'div.slds-modal > div.slds-modal__container {width: 70% !important; max-width: 70% !important; padding: 1rem 0 1rem 0}';
const MODAL_SIZE_90_PERCENT = 'div.slds-modal > div.slds-modal__container {width: 90% !important; max-width: 90% !important; padding: 1rem 0 1rem 0}';


/**
 * @param {module:lightning/uiObjectInfoApi.PicklistValues} getPicklistValuesResult
 * @param {string} dependentFieldValue
 * @return {PicklistValue[]}
 */
const resolveDependentPicklistValues = (getPicklistValuesResult, dependentFieldValue) => {
    const cleanedValue = trimmedStringOrUndefined(dependentFieldValue);
    if (cleanedValue === undefined || !getPicklistValuesResult) {
        return [];
    }
    const selectedValue = getPicklistValuesResult.controllerValues[cleanedValue];
    if (Number.isInteger(selectedValue) === false) {
        return [];
    }
    const output = [];
    for (let i = 0, j = getPicklistValuesResult.values.length; i < j; i++) {
        const value = getPicklistValuesResult.values[i];
        if (value.validFor.includes(selectedValue) === true) {
            output.push(value);
        }
    }
    return output;
}

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|number}
 */
const integerOrDefault = (value, defaultValue) => {
    const num = parseInt(value);
    return isNaN(num) === true ? defaultValue : num;
}

/**
 * @param {*} value
 * @param {*} [defaultValue=undefined]
 * @return {*|Date}
 */
const dateOrDefault = (value, defaultValue) => {
    if (!value) {
        return defaultValue;
    }
    let dateValue;
    if (value instanceof Date) {
        dateValue = value
    } else if (typeof value === "string") {
        dateValue = new Date(value);
    } else {
        return defaultValue;
    }
    return isDateValid(dateValue) === true
        ? dateValue
        : defaultValue;
}

/**
 * Example of use: JSON.stringify(myData, getCircularReplacer());
 * @return {(function(*, *): (string|null|*))|*}
 */
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Replaced]";
            }
            seen.add(value);
        }
        if (value === undefined) {
            return null;
        }
        return value;
    };
};

/**
 * Returns a relative day string such as "today", "less than a day ago",
 * or "_n_ days ago".
 *
 * @param {Date} date
 * @return {string}
 */
const getTimeOffsetDays = date => {
    const today = new Date();
    const offsetNumber = Math.trunc(
        (new Date() - date) / 86400000 //1000*60*60*24
    );
    if (offsetNumber === 0) {
        return today.getDay() === date.getDay()
            ? "today"
            : "less than a day ago";
    }
    return offsetNumber === 1
        ? "1 day ago"
        : offsetNumber + " days ago";
}

/**
 * Returns a promise that waits for a given duration.
 *
 * @param durationInMs
 * @return {Promise<unknown>}
 */
const waitAsync = durationInMs => {
    return new Promise(resolve => {
        setTimeout(resolve, durationInMs || 0);
    });
}


export {
    acceptedFileTypes,
    yesterday,
    today,
    addDays,
    getQueryParameters,
    sortData,
    convertToCSV,
    exportCSVFile,
    filterData,
    displayErrorMessage,
    reportFieldValidityAndFocus,
    getLocalIsoDateString,
    getLocalIsoDateStringForICU,
    isDateValid,
    dateToLocalIsoString,
    randomString,
    oxfordJoin,
    escapeHtml,
    stripHtml,
    isStringEmpty,
    isRichTextEmpty,
    buildMinimaMaximaDescription,
    flattenObject,
    inflateObject,
    equalsIgnoringCase,
    addDatatableError,
    getRowNumForId,
    validateUploadedFileName,
    validateUploadedFileNameLength,
    arePrimitiveValueArraysEqual,
    trimmedStringOrUndefined,
    inExperienceBuilder,
    MODAL_SIZE_70_PERCENT,
    MODAL_SIZE_90_PERCENT,
    deepClone,
    resolveDependentPicklistValues,
    integerOrDefault,
    dateOrDefault,
    getCircularReplacer,
    getTimeOffsetDays,
    waitAsync
};