stg.simple = function() {

	var states = new stg.States();
	states.fetch();
	states.on('sync', function() {});

	/*
	 * Get shape file from server.
	 * @param {function} next - Callback.
	 */
	var getGeoJson = function(next) {
		$.get('data/us-states-10m.json', function(data) {
			data = topojson.feature(data, data.objects.states);
			next(data);
		});
	};

	/* 
	 * Visualize.
	 * @param {object} geoJson - Shape file.
	 * @param {object} collection - Backbone collection instance.
	 */
	var visualize = function(geoJson, collection) {
		
		var getModelByFeature = function(feature) {
			return collection.findWhere({ id: feature.id });
		};

		var svg = d3.select('.viz').append('svg'),
			g = svg.append('g'),
			projection = d3.geo.albersUsa(),
			path = d3.geo.path().projection(projection);

		g.selectAll('path')
			.data(geoJson.features)
			.enter()
			.append('path')
			.attr({ 
				d: path,
				class: function(feature) {
					var model = getModelByFeature(feature);
					if (model) {
						return model.hasConsiderableSize() ? 'active' : 'inactive';
					}
				}
			})
			.on('click', function(feature) { 
				var model = getModelByFeature(feature);
			});

	};


	var getRich = function(geoJson, collection) {
		var rgj;
		rgj = new stg.RichGeoJson(geoJson);
		rgj.injectCollection(collection, 'id');
		// rgj = new stg.RichGeoJson();
		// rgj.buildFromLatLongCollection(collection);
		// console.log(rgj);
	};

	// Launch visualization.
	getGeoJson(function(geoJson) { 
		visualize(geoJson, states); 
	});

	// Launch visualization.
	getGeoJson(function(geoJson) { 
		getRich(geoJson, states); 
	});

};