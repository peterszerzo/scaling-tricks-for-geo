/*
 * Rich GeoJson object.
 * Extends from a generic object class that provides custom initialize method and 
 *   Backbone's event system.
 */
stg.RichGeoJson = Marionette.Object.extend({

	/*
	 * Initialize object.
	 * @param {object} geoJson - GeoJson to instantiate with. Optional.
	 * @returns {object} this
	 */
	initialize: function(geoJson) {
		this.set(geoJson);
		return this;
	},


	/*
	 * 
	 * @param {object} feature
	 * @returns {object} this
	 */
	addFeature: function(feature) {
		this.features.push(feature);
		return this;
	},


	/*
	 * Checks if is empty.
	 * 
	 */
	isEmpty: function() {
		return (this.features.length === 0);
	},


	/*
	 * Set geoJson
	 * @param {object} geoJson 
	 * @returns {object} this
	 */
	set: function(geoJson) {
		this.type = 'FeatureCollection';
		if (stg.util.exists(geoJson)) {
			this.features = geoJson.features;
		} else {
			this.features = [];
		}
		return this;
	},


	/*
	 * Inject model references into GeoJson.
	 * @param {object} collection
	 * @param {string} key - Key to join by. 
	 *     If ommitted, injection takes places solely based on the more comprehensive options.
	 * @param {integer} options - Injection options, such as backup keys and case-sensitivity.
	 */
	injectCollection: function(collection, key, options) {

		// To be implemented.
		var injectionLogs = [ 
			'The injection went alright.',
			'This method may be extended so that I can include information such as how many models in the collection could be injected successfully.'
		];

		// Use default options if none is specified.
		options = options || this.defaultInjectionToleranceOptions;

		// Create logs to help visualization creators investigate whether loose injections work properly.
		injectionLogs = [];

		// // Example options:
		// options = {
		// 	isCaseSensitive: true,
		// 	keys: [ 'name', 'title' ],
		// 	matcher: function() {
		// 		return true;
		// 	}
		// };

		// extend method to include toleranceOptions
		_.each(this.features, function(feature) {
			var query = {}, model;
			if (feature.properties && feature.properties[key]) {
				query[key] = feature.properties[key];
			} else {
				query[key] = feature[key];
			}
			model = collection.findWhere(query);
			if (model) { feature._model = model; }
		});

		// Execute onReady callback if exists.
		if (stg.util.exists(this.onReady)) { this.onReady(); }

		return this;
	},


	/*
	 * Get model value, given a list of possible keys. Returns first match.
	 * @param {object} model
	 * @param {array} keys - List of possible keys.
	 * @returns {number|string|object|array} value
	 */
	getValue: function(model, keys) {
		var value, i, len, key;
		for (i = 0, len = keys.length; i < len; i += 1) {
			key = keys[i];
			if (stg.util.exists(model.get(key))) { return model.get(key); }
		}
	},


	/*
	 * This method readily assumes that the collection contains latitude and longitude data.
	 * @param {object} collection
	 * @param {object} buildOptions
	 */
	buildFromLatLongCollection: function(collection, options) {

		var self = this;

		options = options || this.buildFromLatLongOptions;

		collection.each(function(model) {
			var lat = self.getValue(model, options.latKeys),
				lng = self.getValue(model, options.longKeys),
				feature = {
				type: 'Feature',
				_model: model,
				geometry: {
					type: 'Point',
					coordinates: [ lng, lat ]
				}
			};
			self.addFeature(feature);
		});

		// Execute onReady callback if exists.
		if (stg.util.exists(this.onReady)) { this.onReady(); }

		return this;

	},


	/*
	 * Default list of build-from-lat-long options.
	 */
	buildFromLatLongOptions: {
		latKeys: [ 'lat', 'latitude', 'Latitude', 'Lat' ],
		longKeys: [ 'long', 'lng', 'longitude', 'Longitude', 'Long', 'Lng' ]
	},


	/*
	 * Default tolerance options.
	 */
	defaultInjectionToleranceOptions: {
		// When primary injection key is not matched, use backups.
		backupKeys: [ ],
		// Is matching case sensitive.
		isCaseSensitive: true,
		// Most custom matcher 
		customMatcher: function(feature, model) { 
			return true; 
		}
	}

});