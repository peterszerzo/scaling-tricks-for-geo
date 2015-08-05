stg.runApp = function() {

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

	// Create collection.
	var states = new stg.States();
	states.fetch();

	// Configure rich geojson when the states are fetched.
	states.on('sync', function() {

		var rgj = new stg.RichGeoJson();

		// Set ready callback before building rgj.
		rgj.onReady = function() {
			var v = new stg.StatesView({ 
				el: '.viz',
				richGeoJson: rgj
			});
			v.render();
			v.on('summary:change', function(text) {
				$('.viz__text').html(text);
			}); // This example does not destroy this view, so no unbinding is necessary here.
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