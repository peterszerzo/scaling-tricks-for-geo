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
		this.type = 'FeatureCollection';
		if (typeof geoJson !== "undefined") {
			this.features = geoJson.features;
		} else {
			this.features = [];
		}
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


	isReady: function() {
		return (this.features.length > 0);
	},


	/*
	 * Set callback to execute when object is ready.
	 * @returns {object} this
	 */
	onReady: function(next) {
		if (this.isReady()) {
			// Run callback if already ready.
			return next();
		} else {
			// Run callback on ready event.
			this.on('sync', next);
		}
	},


	/*
	 * Inject model references into GeoJson.
	 * @param {object} collection
	 * @param {string} key - Key to join by. 
	 *     If ommitted, injection takes places solely based on the more comprehensive options.
	 * @param {integer} options - Injection options, such as backup keys and case-sensitivity.
	 */
	injectCollection: function(collection, key, options) {

		// Create logs to help visualization creators investigate whether loose injections work properly.
		var injectionLogs = [];

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
	buildFromLatLongCollection: function(collection, buildOptions) {

		var self = this;

		// Build comprehensive list of possible values.
		buildOptions = buildOptions || {
			latKeys: [ 'lat', 'latitude', 'Latitude', 'Lat' ],
			longKeys: [ 'long', 'lng', 'longitude', 'Longitude', 'Long', 'Lng' ]
		};

		collection.each(function(model) {
			var lat = self.getValue(model, buildOptions.latKeys),
				lng = self.getValue(model, buildOptions.longKeys),
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

		return this;

	},


	/*
	 * 
	 */
	toleranceOptions: {
		// When primary injection key is not matched, use backups.
		backupKeys: [ 'name', 'title' ],
		// Is matching case sensitive.
		isCaseSensitive: true,
		// Most custom matcher 
		customMatcher: function(feature, model) { 
			return true; 
		}
	}

});