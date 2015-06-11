stg.simple = function() {

	/*
	 * Get shape file from server.
	 * @param {function} next - Callback.
	 */
	var fetchGeoJson = function(path, next) {
		$.get(path, function(data) {
			data = topojson.feature(data, data.objects.states);
			next(data);
		});
	};


	/* 
	 * Visualize.
	 * @param {object} geoJson - Shape file.
	 * @param {object} collection - Backbone collection instance.
	 */
	var visualize = function(rgj) {
		
		var svg = d3.select('.viz').append('svg'),
			g = svg.append('g'),
			projection = d3.geo.albersUsa(),
			path = d3.geo.path().projection(projection);

		var setVizText = function(text) {
			$('.viz__text').html(text);
		};

		g.selectAll('path')
			.data(rgj.features)
			.enter()
			.append('path')
			.attr({ 
				d: path,
				class: function(feature) {
					var model = feature._model;
					if (model) {
						return model.isRealBig() ? 'active' : 'inactive';
					}
				}
			})
			.on('click', function(feature) { 
				var model = feature._model;
				setVizText(model.getSummary());
			});

	};


	// Create collection.
	var states = new stg.States();
	states.fetch();

	// Configure rich geojson when the states are fetched.
	states.on('sync', function() {

		var rgj = new stg.RichGeoJson();

		// Set ready callback before building rgj.
		rgj.onReady = function() {
			visualize(rgj);
		};

		//
		// What comes next may be synchronous buildup or async geodata fetching.
		// onReady executes in both cases.
		//

		// Fetch states data.
		fetchGeoJson('data/us-states-10m.json', function(data) {
			rgj.set(data);
			rgj.injectCollection(states, 'id');
		});

	});

};