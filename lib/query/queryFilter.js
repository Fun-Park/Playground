// noinspection JSUnresolvedVariable
/**
 * A wrapper to enable simple jsForce queries
 * without a deep understanding of mongoDB.
 */
module.exports = class QueryFilter {

    /**
     * The clauses object.
     *
     * @type {Object}
     * @private
     */
    __clauses = {};

    /**
     * Adds an "equals" clause to the query.
     *
     * @param {string} fieldName
     * @param {string|number} value
     * @returns {QueryFilter}
     */
    addEqualsClause(fieldName, value) {
        this.__addClause(
            fieldName,
            value
        );
        return this;
    }

    /**
     * Adds a "not equals" clause to the query.
     *
     * @param {string} fieldName
     * @param {string|number} value
     * @returns {QueryFilter}
     */
    addNotEqualsClause(fieldName, value) {
        this.__addClause(
            fieldName,
            {
                $ne : value
            }
        );
        return this;
    }

    /**
     * Adds an "in" clause to the query.
     *
     * @param {string} fieldName
     * @param {string[]|number[]} values
     * @returns {QueryFilter}
     */
    addInClause(fieldName, values) {
        this.__addClause(
            fieldName,
            {
                $in : values
            }
        );
        return this;
    }

    /**
     * Adds an "not in" clause to the query.
     *
     * @param {string} fieldName
     * @param {string[]|number[]} values
     * @returns {QueryFilter}
     */
    addNotInClause(fieldName, values) {
        this.__addClause(
            fieldName,
            {
                $nin : values
            }
        );
        return this;
    }

    /**
     * Adds a formatted value to the query clause.
     *
     * @param {string} fieldName
     * @param {string|Object} formattedValue
     * @private
     */
    __addClause(fieldName, formattedValue) {
        //Either create the clause if one does not exist
        //for the specified field, or assign it to the
        //clause.
        if(!this.__clauses[fieldName]) {
            this.__clauses[fieldName] = formattedValue;
        } else {
            Object.assign(this.__clauses[fieldName], formattedValue);
        }
    }

    /**
     * Returns the query clause, formatted and
     * ready for use within jsForce.
     *
     * @returns {Object}
     */
    get value() {
        return Object.assign({}, this.__clauses);
    }

}