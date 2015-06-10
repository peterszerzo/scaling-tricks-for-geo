stg.parseIntCommas = function(string) {
	return parseInt(string.replace(/,/g, ''), 10);
};

stg.State = Backbone.Model.extend({
	parse: function(resp) {
		resp.id = parseInt(resp.id, 10);
		resp['Population (2013 est)'] = stg.parseIntCommas(resp['Population (2013 est)']);
		resp['Total area in (mi2)'] = stg.parseIntCommas(resp['Total area in (mi2)']);
		return resp;
	},
	hasConsiderableSize: function() {
		var area = this.get('Total area in (mi2)'),
			limitArea = this.collection.getTotalArea() * 0.025;
		return (area > limitArea);
	}
});

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



stg.Pin = Backbone.Model.extend({});

stg.Pins = Backbone.Collection.extend({
	model: stg.Pin,
	url: 'data/pins.json'
});