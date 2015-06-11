// State model.
stg.State = Backbone.Model.extend({

	// Parse response into appropriate number values.
	parse: function(resp) {
		resp.id = parseInt(resp.id, 10);
		resp['Population (2013 est)'] = stg.util.parseIntCommas(resp['Population (2013 est)']);
		resp['Total area in (mi2)'] = stg.util.parseIntCommas(resp['Total area in (mi2)']);
		return resp;
	},

	// Checks if the area of the state is greater than 2.5% of the
	//   cumulative area of the collection.
	isRealBig: function() {
		var area = this.get('Total area in (mi2)'),
			limitArea = this.collection.getTotalArea() * 0.025;
		return (area > limitArea);
	},

	// Get summary text.
	getSummary: function() {
		var text = this.isRealBig() ? 
			' is real big - its area is greater than 2.5% of the total area of the US.' : 
			' is not so big - its area is not greater than 2.5% of the total area of the US.';
		return this.get('State') + text;
	}

});

// State collection
stg.States = Backbone.Collection.extend({
	
	model: stg.State,
	url: 'data/states.json',
	comparator: 'Total area in (mi2)',

	getTotalArea: function() {
		var sum = 0;
		this.each(function(model) { 
			sum += model.get('Total area in (mi2)'); 
		});
		return sum;
	}

});


// Map pin model - not used in examples yet.
stg.Pin = Backbone.Model.extend({});

// Map pin collection - not used in examples yet.
stg.Pins = Backbone.Collection.extend({
	model: stg.Pin,
	url: 'data/pins.json'
});