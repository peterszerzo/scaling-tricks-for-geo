var stg = { util: {} };

stg.util.exists = function(obj) {
	return ((typeof obj !== "undefined") && (obj !== null));
};