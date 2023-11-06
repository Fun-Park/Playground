/**
 * Creates a shallow clone of an object, removing
 * any private properties (those starting with an
 * underscore), and any properties that are NULL
 * or UNDEFINED.
 * <br/><br/>
 *
 * Used to strip any inaccessible and empty values
 * from the output of `toJSON` - the method
 * employed by `JSON.stringify`.
 *
 * @param {object} values
 * 					The object to be processed.
 * @param {Object.<string, string|null>} [oldKeyToNewKey]
 * 					An optional field mapping (as
 * 					an associative array), where
 * 					the provided key is the
 * 					original field name, and the
 * 					value is the desired field
 * 					name.  Associating a field to a
 * 					falsy value will cause that field
 * 					to be omitted from the output.
 * @param {object} [basis]
 * 					The original object that should
 * 					be used as a basis for this
 * 					output.  The provided value
 * 					(if any) will be assigned
 * 					(<code>Object.assign</code>)
 * 					to the output <em>prior</em>
 * 					to processing.
 * @returns {object}
 */
const cleanJson = (values, oldKeyToNewKey, basis) => {
	if(!values) {
		return null;
	}
	const out = !basis
		? {}
		: Object.assign({}, basis);
	const transforms = oldKeyToNewKey || {};
	let value,
		finalKey,
		keyTransformed;
	for (let key in values) {

		//Skip non-owned properties
		if (hasOwnProperty(values, key) === false) {
			continue;
		}

		//Get the key to use in the output
		if(hasOwnProperty(transforms, key)) {
			finalKey = transforms[key];
			//Skip keys that are not to be used
			if(!finalKey) {
				continue;
			}
			keyTransformed = true;
		} else {
			finalKey = key;
			keyTransformed = false;
		}

		//Ignore private/protected properties
		if (keyTransformed === false && finalKey.startsWith('_') === true) {
			continue;
		}

		//Check the value of the given key
		value = values[finalKey];

		//Ignore functions
		if(isFunction(value)) {
			continue;
		}

		//Add the property to the JSON output
		//if it has a value.
		if (value !== undefined && value !== null) {
			out[finalKey] = value;
		}
	}
	return out;
}

/**
 * An ES2015+ safe version of hasOwnProperty
 * that supports classes.
 *
 * @param {object} [item]
 * @param {string} [property]
 * @returns {boolean}
 */
const hasOwnProperty = (item, property) => {
	if(!item || !property) return false;
	return item.hasOwnProperty(property) === true ||
		Object.getPrototypeOf(item).hasOwnProperty(property) === true;
}

/**
 * Returns whether a given value is a function.
 *
 * @param {*} value
 * @returns {boolean}
 */
const isFunction = value => {
	return value && {}.toString.call(value) === "[object Function]";
}

module.exports = {
	cleanJson
};