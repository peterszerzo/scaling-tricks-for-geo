Draft blog post and example project.

# On Scalable Interactive Mapping: Recent Favorites Tricks

I spent some time thinking up some interactive mapping strategies that made my recent mapping code more versatile, modular, dry and, best of all, fun to write and maintain. Enough, in fact, that I decided to share them in this post as well as extract them in a [simple project](https://github.com/pickled-plugins/scaling-tricks-for-geo) to provide realistic, living code examples.

I will be touching on the following topics:
* a look at interactive data visualizations inside conventional MV* architectures.
* prototypes for smart data structures that play nicely with different rendering libraries.
* a versatile rendering workflow that elegantly works for map pins, counties, states and countries alike, whether they need additional shape files fetched or not.

The technologies I used: [d3.js](http://d3js.org/), [Leaflet.js](http://leafletjs.com/), [Backbone.js](http://backbonejs.org/), [Marionette.js](http://marionettejs.com/), [GeoJson](http://geojson.org/). I also suspect that some of these ideas may work really well with other frameworks such as [Angular](https://angularjs.org/), [Ember](http://emberjs.com/), and especially if you don't use a framework.

## Interactive Visualizations in an MV* Architecture

"It is easy to use Backbone and D3 together, but it is not easy to use them together well", said Shirley Wu [on Backbone Conf III 2014](https://www.youtube.com/watch?v=TqXD0_tGPv8&list=PLlgxAbM67lYIGw8DnANC7VgREbzJRQged&index=7). Her code examples did a really good job ironing out the differences in which object-oriented Backbone views and functional d3 rendering workflows can be blended together. In an ever-so-slightly different flavor, these ideas found their way into my work as well.

Geomapping applications seemed to add an additional level of complexity. The prominent data structure for mapping, GeoJson (or TopoJson, but it ends up converted into GeoJson at some point in the app lifecycle), looks quite a bit different than a Backbone.Model instance. And so, looking for a solution that is lighter than [Backbone.Leaflet](https://github.com/LuizArmesto/backbone.leaflet), I set out to do my own experiments.

### On View Data. GeoJson, Enriched

#### A Short-lived Misconception

In several MV* framworks, models are available in the views with all their convenience methods. ``this.model.getSummary()``, ``@resource.createdSince()`` show up in view code across languages and frameworks for our enjoyment and relaxed nerves. When I started out rendering GeoJson-based data, I thought I had to abandon this to idea for seemingly rigid, static constructs like this:

	geoJson = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Point',
				geometry: { /* geometry here */ },
				properties: { /* static properties here */ }
			}
		]
	}

Seeing my data buried into a set data structure made me think that I had to say good bye to the comfort of Rails. But this really, really does not have to happen.

My initial take was to examine the feature object for an id or any other property I could use to link to an outside, comprehensive data model, keeping my good old collection far away from the GeoJson. But I knew I could do better and swim against the current less. Turns out, if I passed a GeoJson file over to the rendering department of our app, its head of operations - d3.js - will be perfectly fine if I smuggled in a couple of rich, logic-packed Backbone model references, as such:

	features: [
		{
			_model: /* A Backbone model instance */,
			type: 'Point',
			geometry: { /* geometry here */ },
			properties: { /* this we don't even need from this point on */ }
		}
	]

If we look at rendering code for a second, we see how easily we retrieve these references inside rendering and event handling code, a feature we are so used to from 'conventional' user interface engineering. The model is available right away, no resource-consuming searches and joins needed.

	d3.selectAll('path')
		.data(geoJson.features)
		.enter()
		.append('path')
		.attr('class', function(feature) {
			var model = feature._model;
			/* leverage  */
		})
		.on('click', function(feature) {
			var model = feature._model;
		});

To facilitate injecting these model references into a GeoJson file, I created a class that can be directly passed as GeoJson to d3, along with some nifty mixins and convenience methods that help enrich the bland, static shape files that I used to work with. For the sake of clarity, I named this construct new RichGeoJson().

I was very excited to find that d3 is so welcoming to such smart data structures, so I went ahead and enhanced them some more. Could a build-in event system be useful? Anything else?

#### A Self-sufficient Model

Let's map some datasets with new RichGeoJson() to see if we can figure out new features we'd like. Our day is starting out jolly as we look at our first one:

	collectionData = [
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 }
	];

Make them into Backbone models, squeeze the latitudes/longitudes into arrays, build up a GeoJson, smuggle in the _model references, and head for an early mid-morning snack. The RichGeoJson constructor that I implemented even provides a method to do this automatically with some room for customization:

	// stg.Pins extends from Backbone.Collection
	collection = new stg.Pins(collectionData);

	rgj = new stg.RichGeoJson();
	rgj.buildFromLatLongCollection(collection, {
		latKeys: [ 'lat', 'latitude', 'Lat' ],
		longKeys: [ 'long', 'longitude', 'Long' ]
	});
	// proceed to rendering

Already, there is clear, convenient support for messy, inconsistent data that encodes latitude and longitude values with different keys - an idea I am certainly looking to expand. 

Our second dataset looks a bit different:

	statesData = [
		{ name: 'Nebraska', population: 100000, region: 'Midwest' },
		{ name: 'Arizona' }
		/* ... */
	];

No biggie - I'll just load in our trusted us-states.geo.json, do some joining with a RichGeoJson instance, and call it a day.
	
	// stg.States extends from Backbone.Collection
	states = new stg.States(states);

	$.get('data/us-states.geo.json', function(data) {
		var rgj = new stg.RichGeoJson(data);
		// join by name
		rgj.injectCollection(states, 'name', toleranceOptions);
		// proceed to rendering
	});

The ``toleranceOptions`` argument is not currently implemented, but it is definitely something I'd like to expand on later, as joining data is often tricky. It could include features such as case-sensitivity, the number of characters that can be off (``'newJersey'`` should still be joined with ``New Jersey``), backup join keys, and so on. ``#injectCollections()`` could return join statistics such as how many collection items could be injected, if there were several that could have been injected into the same GeoJson feature, and so on. Developers can refine join tolerance based on the feedback they get from any previous attempt. Messy data, you have got nothing on us.

#### Daydreaming Cut Short: Sync vs. Async 

I notice that the implementations for states and pindrop above look quite a bit different. One is synchronous and yields richGeoJson immediately, the other one may well keep a spinner icon waiting through a five-second server lag before it reaches the screen. I am not very happy with keeping these different implementations in mind, adding rendering logic to different places, one roaming free and the other trapped in a callback or a ``promise.done()`` statement. I settled with writing asynchronous code whether I needed it or not, as follows:

	var rgj = new stg.RichGeoJson();
	// construct rgj here, whether through build-from-lat-long or ajax-fetch-and-inject
	rgj.onReady(function() {
		// call rendering module with rich data
	});

``rgj`` should be smart enough to know when to execute this code, so that nothing else be needed to keep different implementations look the same. In my case, it made mapping code clearer to read and easier to extend.

### On View Rendering: Conventional, Interactive, Data-Driven

The data- and model-related implementations above centered around polymorphism, and view-related ones did the same thing. From my very first experiences tinkering with d3 code I had a hard time keeping my code clean, and generally felt sceptical that most d3 code examples available online, with all their nesting and lack of high-level clarity, could scale (which is not to imply that these insightful pieces of code failed in any expectations that they were intended to live up to). 

On the other hand, I really got used to Backbone views, and so, inspired by Shirly Wu's code examples, I ended up splitting up my d3 code into methods of a custom view object - methods that copy a Backbone view's API. The difference I made was that I didn't extend from a ``Backbone.View``, but from a generic ``Marionette.Object``. 

	View = Marionette.Object.extend({
		onRender: function() {},
		renderContainer: ,
		render: function() {},
		update: function() {},
		destroy: function() {}
	});

## Conclusion

I had a great time writing code like this, and I am having an equally great time writing it out in this post. I am sure things can be better - and I look forward to hearing what you think.