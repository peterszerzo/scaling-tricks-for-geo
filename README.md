Draft blog post and example project.

# On Scalable Interactive Mapping: Recent Favorites Tricks

I spent some time thinking up some interactive mapping strategies that made my recent mapping code more versatile, modular, dry and, best of all, fun to write and maintain. Enough, in fact, that I decided to share them in this post as well as extract them in a [simple project](https://github.com/pickled-plugins/scaling-tricks-for-geo) to provide realistic, living code examples.

I will be touching on the following topics:
* a look at interactive data visualizations inside conventional MV* architectures.
* prototypes for smart data structures that play nicely with different rendering libraries.
* a versatile rendering workflow that works strikingly similarly for map pins, counties, states and countries alike, whether they need additional shape files fetched or not.

The technologies I used: [d3.js](http://d3js.org/), [Leaflet.js](http://leafletjs.com/), [Backbone.js](http://backbonejs.org/), [Marionette.js](http://marionettejs.com/), [GeoJson](http://geojson.org/). I also suspect that some of these ideas, code samples and constructors may work really well with other frameworks such as [Angular](https://angularjs.org/) or [Ember](http://emberjs.com/), and especially if you don't use a framework at all.

The project is run by navigating to the root of the project folder in the command line and typing:

	python -m SimpleHTTPServer 1848

In the browser, navigate to:

	localhost:1848

## Interactive Visualizations in an MV* Architecture

On using a populat MV* framework - Backbone - and the most popular dataviz library - d3.js -, Shirley Wu said "Yup, I totally agree, it's really not that difficult. But what I do think is challenging (and interesting), is to use them together well". I resonated not only with the statement, but with the code examples she presented [on Backbone Conf III 2014](https://www.youtube.com/watch?v=TqXD0_tGPv8&list=PLlgxAbM67lYIGw8DnANC7VgREbzJRQged&index=7). She did a really good job ironing out the differences in which object-oriented Backbone views and functional d3 rendering workflows can be blended together. In an ever-so-slightly different flavor, these ideas found their way into my work as well.

However, when I turned to using d3 for Geomapping applications within a larger Backbone app, I noticed an additional level of complexity. The prominent data structure for mapping, GeoJson (or TopoJson, which ends up converted into GeoJson at some point in the app lifecycle), looks quite a bit different than a Backbone model or collection. It has custom geometry data, a large file size. Working with it took some time to get accustomed to, and here is what I learned and the tricks that worked well for me.

### On View Data: GeoJson, Enriched

#### A Short-lived Misconception

In several MV* framworks, models are available in the views with all their convenience methods. ``this.model.getSummary()``, ``@resource.createdSince()`` show up in view code across languages and frameworks for our enjoyment and relaxed nerves. When I started out rendering GeoJson-based data, I thought I had to abandon this luxury for seemingly rigid, static constructs like the following:

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

Seeing my data buried into a set data structure made me think that I had to say good bye to the Rails-like comfort of prior, in a way more traditional MV* applications. But this really does not have to happen.

My initial take was to examine the feature object for an ``id`` or any other property I could use to link to an outside, comprehensive data model, keeping my good old collection separate from the GeoJson. But I knew I could do better and swim against the current less. Turns out, if I passed a GeoJson file over to a ``d3`` rendering module with righ, logic-packed Backbone models smuggled into its feature collection, I would get no complaints. Here is what I ended up with:

	features: [
		{
			_model: /* a freshly added Backbone model instance */,
			type: 'Point',
			geometry: { /* geometry here */ },
			properties: { /* this we don't even need from this point on */ }
		}
	]

If we look at a sample rendering code, we see how easily we retrieve these references when setting properties and event handlers, a feature I was so used to and so reluctant to abandon.

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

To facilitate injecting these model references into a GeoJson file, I created a class that can be directly passed as GeoJson to d3, along with some nifty mixins and convenience methods that help enrich the bland, static shape files that I used to work with. For the sake of clarity, I named this construct ``new stg.RichGeoJson()`` (``stg`` is the global namespace of my example project).

I was very excited to find that ``d3`` is so welcoming to smarter objects like this, so I went ahead and enhanced them some more. Could a build-in event system be useful? Anything else?

#### Using a Self-sufficient Model

Let's map some datasets with ``new RichGeoJson()`` to see if we can figure out new features we'd like. Our day is starting out jolly as we look at our first one:

	collectionData = [
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 }
	];

Make them into Backbone models, squeeze the latitudes/longitudes into arrays, build up a GeoJson, smuggle in the _model references, and head for an early mid-morning snack. The ``stg.RichGeoJson`` constructor even provides a method to do this automatically with some room for customization:

	// stg.Pins extends from Backbone.Collection
	collection = new stg.Pins(collectionData);

	rgj = new stg.RichGeoJson();
	rgj.buildFromLatLongCollection(collection, {
		latKeys: [ 'lat', 'latitude', 'Lat' ],
		longKeys: [ 'long', 'longitude', 'Long' ]
	});
	// proceed to rendering

Already, there is clear, convenient support for messy, inconsistent data that encodes latitude and longitude values with different keys - an idea I am certainly looking to expand to other areas where data has inconsistent format, or where we don't want to configure the specific formats of different data sets. But onwards to the next set, which looks like this:

	statesData = [
		{ name: 'Nebraska', population: 100000, region: 'Midwest' },
		{ name: 'Arizona' }
		/* ... */
	];

We can load in our trusted us-states.geo.json, do some joining with a RichGeoJson instance, our view is ready for rendering.
	
	// stg.States extends from Backbone.Collection
	states = new stg.States(states);

	$.get('data/us-states.geo.json', function(data) {
		var rgj = new stg.RichGeoJson(data);
		// join by name
		rgj.injectCollection(states, 'name', toleranceOptions);
		// proceed to rendering
	});

The ``toleranceOptions`` specifies additional options that can be used to match models with GeoJson features. It is not currently implemented, but it is definitely something I'd like to expand on later. It could include features such as case-sensitivity, the number of characters that can be extra or off (``'new  jersey'`` should still be joined with ``'New Jersey'``), backup join keys, and so on. ``#injectCollections()`` could return join statistics such as how many collection items could be injected, if there were several that could have been injected into the same GeoJson feature, and so on. Developers can refine join tolerance based on the feedback they get from any previous attempt. Messy data, you have got nothing on us.

#### Daydreaming Cut Short: Sync vs. Async 

I notice that the above implementations for a US states visualization and map pin one look quite a bit different. One is synchronous and yields ``richGeoJson`` immediately, the other one may well keep a spinner icon waiting through a five-second server lag before it shows up on the screen. I am not very happy with keeping these different implementations in mind, adding rendering logic to different places, one roaming free and the other trapped in a callback or a ``promise.done()`` statement. I settled with writing asynchronous code whether I needed it or not, as follows:

	var rgj = new stg.RichGeoJson();
	// set callback to execute when object is ready
	rgj.onReady(function() {
		// call rendering module with rich data
	});
	// construct rgj here, whether through build-from-lat-long or ajax-fetch-and-inject
	// onReady called automatically when things are ready.

``rgj`` is smart enough to execute ``onReady`` after a build or an inject is complete, at which point we have all we need to go on with rendering. In my case, it made mapping code clearer to read and and easier to extend to different applications.

### On View Rendering: Conventional, Interactive, Data-Driven

The data- and model-related implementations above centered around polymorphism, and view-related ones did the same thing. From my very first experiences tinkering with d3 code, I had a hard time keeping my code clean, and generally felt sceptical that most d3 code examples available online, with all their nesting and lack of high-level clarity, could scale (which is not to imply that these insightful pieces of code failed in any expectations that they were intended to live up to). 

On the other hand, I really got used to Backbone views, and so, inspired by Shirley's code examples, I ended up splitting up my d3 code into methods of a custom view object - methods that copy a Backbone view's API and thus behave like any other view my app uses. The difference in my implementation was that I didn't extend from a ``Backbone.View``, but from a generic ``Marionette.Object``. 

	View = Marionette.Object.extend({
		onRender: function() {},
		renderContainer: ,
		render: function() {},
		update: function() {},
		destroy: function() {}
	});

## Conclusion

I had a great time writing code like this, and I am having an equally great time writing it out in this post. I am sure things can be better - and I look forward to hearing what you think.