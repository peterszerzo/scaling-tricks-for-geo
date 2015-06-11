// Defined global namespace.
var stg = {};

// Define utilities component.
stg.util = {};

/*
 * Check if null or undefined.
 * @returns {boolean}
 */
stg.util.exists = function(obj) {
	return ((typeof obj !== "undefined") && (obj !== null));
};

/*
 * Parses a string containing commas into integer.
 * @param {string}
 * @returns {integer}
 */
stg.util.parseIntCommas = function(string) {
	return parseInt(string.replace(/,/g, ''), 10);
};