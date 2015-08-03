// Map pin model - not used in examples yet.
stg.MapPin = Backbone.Model.extend({});

// Map pin collection - not used in examples yet.
stg.MapPins = Backbone.Collection.extend({
	model: stg.MapPin,
	url: 'data/pins.json'
});